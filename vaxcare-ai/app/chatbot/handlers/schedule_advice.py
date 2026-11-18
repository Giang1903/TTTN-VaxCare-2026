from __future__ import annotations

import re

from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.chatbot.memory import get_memory_store
from app.chatbot.rules.eligibility import (
    check_eligibility_from_text,
    format_eligibility_text,
)
from app.chatbot.rules.schedule_engine import advise_schedule, format_schedule_text
from app.chatbot.slots import (
    is_affirmative,
    is_asking_for_other_person,
    resolve_age,
)
from app.schemas.chat import Action, ChatResponse, Source

def _is_age_only_statement(message: str) -> bool:
    """User chỉ nêu tuổi — không kèm câu hỏi / tên vaccine / triệu chứng."""
    from app.chatbot.message_shape import is_pure_age_statement
    # Mọi nội dung hỏi thêm (mũi N, là sao, phác đồ…) → không phải age-only
    # Không liệt kê từng loại vaccine tại đây.
    return is_pure_age_statement(message)



def handle_schedule_advice(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
    history: list | None = None,
    **kwargs,
) -> ChatResponse:
    entities = entities or EntityExtractor().extract(message)
    ctx = context or {}
    store = get_memory_store()
    mem = store.get(session_id)
    soft = dict(mem.soft_context or {})

    # User xác nhận tuổi hồ sơ ở lượt trước đang chờ
    if soft.get("awaiting_age_confirm"):
        if is_asking_for_other_person(message):
            mem.set_soft(
                awaiting_age_confirm=False,
                age_confirmed=False,
                age_years=None,
                age_months=None,
                age_source=None,
                subject="other",
            )
            soft = dict(mem.soft_context)
            return ChatResponse(
                reply=(
                    "Bạn đang hỏi cho người khác. Cho mình biết tuổi "
                    "(ví dụ 2 tuổi hoặc 14 tháng) của người cần tiêm nhé."
                ),
                intent="schedule_advice",
                intent_confidence=conf,
                session_id=session_id,
                meta={
                    "handler": "schedule_advice",
                    "need_age": True,
                    "reason": "subject_other",
                },
            )
        if is_affirmative(message) or (
            entities.get("age_years") is None and entities.get("age_months") is None
            and soft.get("age_source") == "profile"
            and len((message or "").strip()) < 12
        ):
            # Chỉ affirm khi không nêu tuổi mới
            if entities.get("age_years") is None and entities.get("age_months") is None:
                mem.set_soft(age_confirmed=True, awaiting_age_confirm=False, subject="self")
                soft = dict(mem.soft_context)

    # User nêu tuổi mới trong câu → luôn ưu tiên, đánh dấu confirmed
    if entities.get("age_years") is not None or entities.get("age_months") is not None:
        store.update_soft_context(
            session_id,
            {
                "age_years": entities.get("age_years"),
                "age_months": entities.get("age_months"),
                "age_source": "user_message",
                "age_confirmed": True,
                "awaiting_age_confirm": False,
            },
        )
        soft = dict(store.get(session_id).soft_context)

    age_info = resolve_age(entities, ctx, soft)

    sources: list[Source] = []
    actions: list[Action] = []

    is_pregnant = bool(entities.get("is_pregnant"))
    gest_months = entities.get("gestational_months")
    gest_weeks = entities.get("gestational_weeks")
    if not is_pregnant and re.search(
        r"(mang\s*thai|có\s*thai|thai\s*\d+\s*tuần|\d+\s*tuần\s*thai|"
        r"thai\s*phụ|pnct|(?:^|[\s,;])thai(?:\s+\d+|\s|$))",
        message or "",
        re.I,
    ):
        is_pregnant = True
        mw = re.search(r"(\d+)\s*tuần", message or "", re.I)
        if mw and gest_weeks is None:
            gest_weeks = float(mw.group(1))
            gest_months = round(gest_weeks / 4.345, 1)
    if is_pregnant:
        store.update_soft_context(
            session_id,
            {
                "is_pregnant": True,
                "gestational_months": gest_months,
                "gestational_weeks": gest_weeks,
            },
        )
    elif soft.get("is_pregnant"):
        is_pregnant = True
        gest_months = soft.get("gestational_months")
        gest_weeks = soft.get("gestational_weeks")

    eligibility = check_eligibility_from_text(message)
    eligibility_block = ""
    if eligibility.status in ("defer_suggested", "caution", "pregnancy"):
        eligibility_block = format_eligibility_text(eligibility)
        sources.append(
            Source(
                doc_id="tt10-2024" if eligibility.status == "pregnancy" else "qd-1575-byt",
                title=(
                    "TT-10/2024 – tiêm chủng thai phụ"
                    if eligibility.status == "pregnancy"
                    else "Quyết định 1575/QĐ-BYT – Hướng dẫn khám sàng lọc trước tiêm"
                ),
                issuer="Bộ Y tế",
                tier="A",
            )
        )

    # --- Thai kỳ: không bắt buộc tuổi lịch sử người lớn; dùng rule Thai phụ ---
    if is_pregnant and age_info.get("needs_age"):
        # Coi như đủ thông tin để tư vấn theo tuổi thai
        age_info = dict(age_info)
        age_info["needs_age"] = False
        age_info["age_months"] = age_info.get("age_months") or 0
        age_info["age_years"] = age_info.get("age_years") or 0
        age_info["source"] = age_info.get("source") or "pregnancy"

    # --- Thiếu tuổi: hỏi, không bịa ---
    if age_info["needs_age"]:
        logged_in = ctx.get("user_id") is not None or ctx.get("user_id") is not None
        # user_id may be only on request; orchestrator puts it in context
        has_account = bool(ctx.get("user_id") or ctx.get("full_name"))
        if has_account:
            reply = (
                "Tài khoản của bạn chưa có đủ thông tin tuổi trên hồ sơ để gợi ý lịch. "
                "Bạn cho mình biết tuổi người cần tiêm (ví dụ 28 tuổi hoặc 18 tháng), "
                "và đó là bạn hay bé/người thân nhé."
            )
        else:
            reply = (
                "Để gợi ý mốc tiêm đúng, bạn cho mình biết tuổi người cần tiêm "
                "(ví dụ 20 tuổi hoặc 14 tháng) và nếu có, các mũi đã tiêm. "
                "Mình không đoán tuổi khi chưa có thông tin."
            )
        if eligibility_block:
            reply = eligibility_block + "\n\n" + reply
        sources.append(
            Source(
                doc_id="tt10-2024",
                title="Thông tư 10/2024/TT-BYT",
                issuer="Bộ Y tế",
                tier="A",
            )
        )
        # Chờ user trả tuổi để tiếp tục tư vấn lịch
        mem.set_soft(awaiting_age_for_advice=True)
        return ChatResponse(
            reply=reply,
            intent="schedule_advice",
            intent_confidence=conf,
            sources=sources,
            session_id=session_id,
            safe_mode=eligibility.needs_clinician,
            meta={
                "handler": "schedule_advice",
                "need_age": True,
                "age_source": "none",
                "eligibility": eligibility.to_dict(),
            },
        )

    # --- Có tuổi từ hồ sơ nhưng chưa xác nhận ---
    # Khi đang mang thai: không chặn bằng confirm tuổi người lớn — ưu tiên rule Thai phụ
    if (
        age_info["needs_confirm"]
        and age_info["source"] == "profile"
        and not is_pregnant
    ):
        years = age_info["age_years"]
        months = age_info["age_months"]
        age_label = (
            f"{int(months)} tháng"
            if months is not None and months < 36
            else f"{years:g} tuổi" if years is not None else "tuổi trên hồ sơ"
        )
        # Lưu tuổi profile vào soft + chờ confirm
        mem.set_soft(
            age_years=age_info["age_years"],
            age_months=age_info["age_months"],
            age_source="profile",
            age_confirmed=False,
            awaiting_age_confirm=True,
            subject="self",
        )
        reply = (
            f"Theo hồ sơ tài khoản, người tiêm khoảng {age_label}. "
            "Mình tư vấn lịch theo tuổi này nhé?\n\n"
            "Bạn trả lời đúng hoặc ok để tiếp tục theo hồ sơ. "
            "Hoặc nói rõ tuổi khác (ví dụ cho bé 2 tuổi) nếu hỏi cho người khác.\n\n"
            "Mình chỉ gợi ý sau khi xác nhận, không tự suy đoán."
        )
        if eligibility_block:
            reply = eligibility_block + "\n\n" + reply
        return ChatResponse(
            reply=reply,
            intent="schedule_advice",
            intent_confidence=conf,
            sources=sources,
            session_id=session_id,
            safe_mode=eligibility.needs_clinician,
            meta={
                "handler": "schedule_advice",
                "need_confirm": True,
                "age_source": "profile",
                "age_years": age_info["age_years"],
                "age_months": age_info["age_months"],
                "eligibility": eligibility.to_dict(),
            },
        )
    if is_pregnant and age_info.get("needs_confirm") and age_info["source"] == "profile":
        # Ghi nhận tuổi hồ sơ nhưng không chờ confirm — tư vấn theo thai kỳ ngay
        mem.set_soft(
            age_years=age_info["age_years"],
            age_months=age_info["age_months"],
            age_source="profile",
            age_confirmed=True,
            awaiting_age_confirm=False,
            subject="self",
            is_pregnant=True,
            gestational_weeks=gest_weeks,
            gestational_months=gest_months,
        )
        age_info = dict(age_info)
        age_info["needs_confirm"] = False
        age_info["age_confirmed"] = True

    age_months = age_info["age_months"]
    age_years = age_info["age_years"]

    # Đồng bộ soft sau khi đã chắc
    mem.set_soft(
        age_years=age_years,
        age_months=age_months,
        age_source=age_info["source"],
        age_confirmed=True,
        awaiting_age_confirm=False,
        awaiting_age_for_advice=False,
    )

# Chỉ nêu tuổi thuần — nếu còn hỏi mũi/vaccine/triệu chứng thì BỎ QUA (mọi vaccine)
    from app.chatbot.message_shape import has_substantive_question as _has_q
    if (
        not _has_q(message or "")
        and _is_age_only_statement(message)
        and not soft.get("awaiting_age_for_advice")
        and not soft.get("awaiting_faq_age")
        and soft.get("last_intent") != "faq_vaccine"
    ):
        years = age_info.get("age_years")
        months = age_info.get("age_months")
        if months is not None and months < 36:
            age_label = f"{int(months)} tháng"
        elif years is not None:
            age_label = f"{years:g} tuổi"
        else:
            age_label = "tuổi bạn vừa nêu"
        subject = age_info.get("subject") or soft.get("subject")
        who = "bé" if subject == "child" or re.search(r"(bé|con|cháu)", message or "", re.I) else "bạn"
        mem.set_soft(awaiting_age_for_advice=False)
        reply = (
            f"Mình đã ghi nhận {who} khoảng {age_label}. "
            "Bạn muốn hỏi lịch tiêm theo tuổi này, mũi còn thiếu, hay vaccine cụ thể?"
        )
        return ChatResponse(
            reply=reply,
            intent="schedule_advice",
            intent_confidence=conf,
            session_id=session_id,
            meta={
                "handler": "schedule_advice",
                "age_only_ack": True,
                "age_years": years,
                "age_months": months,
                "age_source": age_info.get("source"),
            },
        )

    completed: set[tuple[int, int]] = set()

    records = ctx.get("records") or []
    for r in records:
        try:
            completed.add((int(r["vaccine_id"]), int(r["dose_number"])))
        except (KeyError, TypeError, ValueError):
            pass

    result = advise_schedule(
        age_months=age_months,
        age_years=age_years,
        completed=completed or None,
        is_pregnant=is_pregnant,
        gestational_months=float(gest_months) if gest_months is not None else None,
    )
    rule_text = format_schedule_text(result)
    if is_pregnant:
        g_label = ""
        if gest_weeks is not None:
            g_label = f" (khoảng {gest_weeks:g} tuần thai)"
        elif gest_months is not None:
            g_label = f" (khoảng {gest_months:g} tháng thai)"
        rule_text = (
            f"Đối tượng: phụ nữ đang mang thai{g_label}.\n"
            "Các mũi thường được cân nhắc trong thai kỳ (theo hướng dẫn / khuyến cáo đã nạp):\n"
            + rule_text
            + "\n• Vắc xin sống giảm độc lực (MMR, thủy đậu, BCG, …): thường chống chỉ định khi đang mang thai — để sau khi sinh (và hết chống chỉ định).\n"
            "• Cần khám sàng lọc trước tiêm tại cơ sở; quyết định cuối cùng do nhân viên y tế."
        )
    if age_info["source"] == "profile":
        rule_text = (
            f"Theo hồ sơ tài khoản: khoảng {age_years:g} tuổi ({int(age_months or 0)} tháng).\n"
            + rule_text
        )
    if eligibility_block:
        rule_text = (
            "Kết quả sàng lọc sơ bộ:\n"
            + eligibility_block
            + "\n\nKết quả rule engine:\n"
            + rule_text
        )

    known_sources = list(result.sources or [])
    if eligibility_block:
        known_sources.append("Quyết định 1575/QĐ-BYT")

    main_names = [
        a.vaccine_short
        for a in result.recommendations
        if a.status in ("recommended", "overdue", "upcoming") and not a.is_catch_up
    ]
    catch_up_names = [
        a.vaccine_short
        for a in result.recommendations
        if a.is_catch_up or a.status == "catch_up"
    ]

    reply = rule_text
    reply_source = "rule_engine"
    guard_warnings: list[str] = []

    try:
        messages = build_messages(
            "schedule_advice",
            question=message,
            rule_result=rule_text,
            history=history,
        )
        raw = (get_llm_client().generate(messages) or "").strip()
        if raw and len(raw) > 40:
            guarded = enforce_guardrails(
                raw,
                require_source_hint=True,
                known_sources=known_sources,
                question=message,
            )
            candidate = guarded.text
            guard_warnings = list(guarded.warnings or [])
            raw_l = candidate.lower()
            kept = sum(1 for n in main_names if n and n.lower() in raw_l)
            ok_main = (not main_names) or kept >= max(1, (len(main_names) + 1) // 2)
            first_lines = [ln.strip().lower() for ln in candidate.splitlines() if ln.strip()][:3]
            head = " ".join(first_lines)
            bad_head = False
            for cu in catch_up_names:
                if cu and cu.lower() in head and not any(
                    m.lower() in head for m in main_names[:2] if m
                ):
                    bad_head = True
                    break
            if ok_main and not bad_head:
                reply = candidate
                reply_source = "llm+rule"
            else:
                guard_warnings.append("llm_rejected_fallback_rule")
    except Exception as e:
        guard_warnings.append(f"llm_error:{type(e).__name__}")

    if "nhân viên y tế" not in reply.lower() and "cơ sở tiêm" not in reply.lower():
        reply = reply.rstrip() + (
            "\n\nLưu ý: đây là gợi ý theo lịch tham khảo, "
            "không thay thế tư vấn của bác sĩ / cơ sở tiêm chủng."
        )

    for s in result.sources[:4]:
        sources.append(
            Source(
                doc_id=s.lower().replace(" ", "-")[:40],
                title=s,
                issuer="Bộ Y tế / WHO" if "tt" in s.lower() or "who" in s.lower() else None,
                tier="A" if "tt10" in s.lower() or "tt52" in s.lower() else "B",
            )
        )

    actions.append(Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking"))

    return ChatResponse(
        reply=reply,
        intent="schedule_advice",
        intent_confidence=conf,
        sources=sources,
        actions=actions,
        session_id=session_id,
        safe_mode=eligibility.needs_clinician,
        meta={
            "handler": "schedule_advice",
            "age_months": result.age_months,
            "age_years": result.age_years,
            "age_source": age_info["source"],
            "n_recommendations": len(result.recommendations),
            "reply_source": reply_source,
            "guard_warnings": guard_warnings,
            "eligibility": eligibility.to_dict(),
        },
    )
