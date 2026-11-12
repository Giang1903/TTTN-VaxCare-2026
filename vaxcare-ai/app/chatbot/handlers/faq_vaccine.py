from __future__ import annotations

import logging
import re
from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.chatbot.rules.eligibility import (
    check_eligibility_from_text,
    format_eligibility_text,
)
from app.schemas.chat import Action, ChatResponse, Source

logger = logging.getLogger(__name__)

_DISEASE_Q = re.compile(
    r"(nguyên\s*nhân|lý\s*do\s*(mắc|bệnh)|vì\s*sao\s*(mắc|bị|nhiễm)|"
    r"đường\s*lây|lây\s*qua|triệu\s*chứng|biểu\s*hiện|"
    r"mắc\s*bệnh\s*(do|vì)|bị\s*nhiễm\s*(do|vì)|"
    r"cause\s+of|why\s+(do\s+people\s+)?get|transmission|symptom)",
    re.I,
)

_VACCINE_CONTEXT = re.compile(
    r"(tiêm|vắc\s*xin|vaccine|liều|mũi|chống\s*chỉ\s*định|"
    r"chỉ\s*định|phác\s*đồ|lịch\s*tiêm|tcmr|hd\s*sd)",
    re.I,
)
_ETIOLOGY_CONTEXT = re.compile(
    r"(nguyên\s*nhân|đường\s*lây|lây\s*truyền|virus|vi\s*khuẩn|"
    r"triệu\s*chứng|cơ\s*chế|nhiễm\s*trùng|pathogen|transmission|etiology)",
    re.I,
)


def _disease_examples(message: str) -> str:
    """Gợi ý câu hỏi vaccine khớp bệnh user đang hỏi (không luôn COVID)."""
    t = (message or "").lower()
    pairs = [
        (("dại", "rabies"), "Vaccine dại phòng bệnh gì?", "Ai nên tiêm vaccine dại?"),
        (("phế cầu", "pneumo", "prevenar", "pcv"), "Vaccine phế cầu phòng bệnh gì?", "Lịch tiêm phế cầu thế nào?"),
        (("sởi", "mmr", "quai bị", "rubella"), "Vaccine MMR phòng bệnh gì?", "Phác đồ MMR như thế nào?"),
        (("covid", "sars-cov", "ncov"), "Vaccine COVID phòng bệnh gì?", "Ai nên tiêm vaccine COVID?"),
        (("hpv",), "Vaccine HPV phòng bệnh gì?", "Ai nên tiêm HPV?"),
        (("cúm", "flu"), "Vaccine cúm phòng bệnh gì?", "Khi nào nên tiêm cúm?"),
        (("viêm gan", "hep"), "Vaccine viêm gan B phòng bệnh gì?", "Phác đồ viêm gan B?"),
        (("bcg", "bbg", "lao"), "Vaccine BCG phòng bệnh gì?", "Khi nào tiêm BCG?"),
    ]
    for keys, e1, e2 in pairs:
        if any(k in t for k in keys):
            return f"- {e1}\n- {e2}"
    return "- Vaccine phòng bệnh gì?\n- Tiêm mấy mũi / ai nên tiêm?"


def _is_protocol_question(text: str) -> bool:
    t = (text or "").lower()
    return bool(
        re.search(
            r"(phác\s*đồ|lịch\s*tiêm|bao nhiêu\s*mũi|mấy\s*mũi|tiêm\s*bao nhiêu|"
            r"cần\s*tiêm\s*(mấy|bao nhiêu)|liều\s*trình|mấy\s*liều|bao nhiêu\s*liều|"
            r"khoảng\s*cách.*mũi|tiêm\s*vào\s*lúc\s*nào|schedule|tiêm\s*như\s*nào|"
            r"ai (nên|phải) tiêm|người nào (nên|phải) tiêm|đối tượng tiêm|"
            r"2\s*liều|3\s*liều|hai\s*liều|ba\s*liều)",
            t,
        )
    )


def _stated_completed_dose(text: str) -> int | None:
    """User nói đã tiêm mũi N → trả về N."""
    t = (text or "").lower()
    m = re.search(r"(?:đã\s*tiêm|tiêm\s*xong|xong)\s*(?:mũi|liều)\s*(\d+)", t)
    if m:
        return int(m.group(1))
    m = re.search(r"(?:mũi|liều)\s*(\d+)\s*(?:rồi|xong)", t)
    if m:
        return int(m.group(1))
    return None


def _asks_next_dose(text: str) -> bool:
    t = (text or "").lower()
    return bool(
        re.search(
            r"(mũi\s*\d+|mũi\s*tiếp|bao\s*lâu|khi\s*nào\s*tiêm|cách\s*bao\s*lâu|"
            r"bao\s*lâu\s*nữa|tiêm\s*tiếp)",
            t,
        )
    )



def _is_confirm_followup(text: str) -> bool:
    """Câu xác nhận ngắn: phải không / đúng không / vậy hả / có sao..."""
    t = (text or "").strip().lower()
    if not t or len(t) > 140:
        return False
    return bool(
        re.search(
            r"(phải không|đúng không|có phải|phải ko|đúng ko|phải k|đúng k|"
            r"phải vậy không|đúng vậy không|có đúng không|có phải không|"
            r"đúng chứ|đúng nhỉ|phải chứ|được không|đúng hả|phải hả|"
            r"vậy hả|thế hả|vậy à|thế à|vậy ư|đúng ư|"
            r"ý (bạn|mày|em) là|ý là|tức là|nghĩa là|"
            r"^(vậy là|thế là|vậy|thế)\b|"
            r"là (như|vậy|thế) (nhé|nha|hả|à|đúng không|phải không)?|"
            r"không phải (sao|hả|à)|hay sao|đúng sao|"
            r"confirm|right\?|is that (right|correct))",
            t,
        )
    )



def _short_protocol_summary(
    rows: list[dict],
    vlabel: str,
    question: str = "",
    *,
    is_confirm: bool = False,
) -> str:
    """
    Tóm tắt ngắn theo *phác đồ N liều / nhóm tuổi*, không liệt kê từng mũi 1-2-3.
    """
    if not rows:
        return ""

    sources: list[str] = []
    # Gom gợi ý phác đồ từ note + age_group
    # Ví dụ note: "HPV ưu tiên 9–14 tuổi phác đồ 2 liều" / "Từ 15 tuổi thường 3 liều"
    regimen: dict[int, list[str]] = {}  # N liều -> list mô tả nhóm
    flat_parts: list[str] = []

    for r in rows:
        age_g = (r.get("age_group") or "").strip()
        note = (r.get("note") or "").strip()
        text = f"{age_g} {note}".strip()
        if text:
            flat_parts.append(text)
        src = (r.get("source_doc") or "").strip()
        if src and src not in sources:
            sources.append(src)

        # Bắt "phác đồ 2 liều" / "thường 3 liều" / "2 liều" trong note
        n_match = re.findall(
            r"(?:phác\s*đồ\s*)?(\d+)\s*liều|(?:phác\s*đồ\s*)?(hai|ba)\s*liều",
            text.lower(),
        )
        word = {"hai": 2, "ba": 3}
        found_ns: list[int] = []
        for m in re.finditer(
            r"(?:phác\s*đồ\s*)?(\d+)\s*liều|(?:phác\s*đồ\s*)?(hai|ba)\s*liều",
            text.lower(),
        ):
            if m.group(1):
                found_ns.append(int(m.group(1)))
            elif m.group(2):
                found_ns.append(word[m.group(2)])
        for n in found_ns:
            label = age_g or note or text
            # Ưu tiên age_group làm nhãn nhóm
            label = age_g if age_g else note
            if not label:
                continue
            regimen.setdefault(n, [])
            if label not in regimen[n] and age_g not in " ".join(regimen[n]):
                # Tránh trùng
                if label not in regimen[n]:
                    regimen[n].append(label)

    lines: list[str] = []
    prefix = f"Đúng. Với {vlabel}" if is_confirm else f"Với {vlabel}"

    if regimen:
        # Có thông tin phác đồ N liều
        if is_confirm and 3 in regimen and re.search(
            r"(3\s*liều|ba liều).*(lớn|15|người lớn)|lớn.*(3\s*liều|ba liều)",
            (question or "").lower(),
        ):
            g3 = ", ".join(regimen.get(3, [])[:2]) or "từ khoảng 15 tuổi"
            g2 = ", ".join(regimen.get(2, [])[:2]) or "9-14 tuổi"
            lines.append(
                f"{prefix}, phác đồ 3 liều thường dùng cho nhóm {g3}; "
                f"phác đồ 2 liều thường cho nhóm {g2}."
            )
        elif is_confirm and 2 in regimen and re.search(
            r"(2\s*liều|hai liều).*(9|14|trẻ)",
            (question or "").lower(),
        ):
            g2 = ", ".join(regimen.get(2, [])[:2]) or "9-14 tuổi"
            g3 = ", ".join(regimen.get(3, [])[:2]) or "từ khoảng 15 tuổi"
            lines.append(
                f"{prefix}, phác đồ 2 liều thường cho nhóm {g2}; "
                f"phác đồ 3 liều thường cho nhóm {g3}."
            )
        else:
            lines.append(f"{prefix}:")
            for n in sorted(regimen.keys()):
                groups = ", ".join(regimen[n][:3])
                lines.append(f"- Phác đồ {n} liều: {groups}")
    else:
        # Không parse được "N liều" trong note → tóm tắt theo age_group unique
        ages = []
        for r in rows:
            age_g = (r.get("age_group") or "").strip()
            note = (r.get("note") or "").strip()
            if age_g and age_g not in ages:
                ages.append(age_g if not note else f"{age_g} ({note[:60]})")
        lines.append(f"{prefix}:")
        for a in ages[:6]:
            lines.append(f"- {a}")

    if sources:
        lines.append("Nguồn: " + ", ".join(sources[:3]) + ".")
    lines.append(
        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tiêm."
    )
    return "\n".join(lines)



def _is_disease_question(text: str) -> bool:

    return bool(_DISEASE_Q.search(text or ""))


def _context_has_etiology(context: str) -> bool:
    if not context:
        return False
    return bool(_ETIOLOGY_CONTEXT.search(context))


def _try_retrieve(query: str, vaccine_id: int | None = None) -> dict:
    try:
        from app.services.model_loader import get_retriever

        retriever = get_retriever()
        if retriever is None:
            return {"hits": [], "enough_evidence": False, "max_score": 0.0}
        return retriever.retrieve(query, vaccine_id=vaccine_id)
    except Exception as e:
        logger.warning("Retrieval unavailable: %s", e)
        return {"hits": [], "enough_evidence": False, "max_score": 0.0}


def _normalize_vaccine_names(entities: dict[str, Any] | None) -> list[str]:
    """entities['vaccines'] có thể là list str hoặc list dict."""
    out: list[str] = []
    for v in (entities or {}).get("vaccines") or []:
        if isinstance(v, str) and v.strip():
            out.append(v.strip())
        elif isinstance(v, dict):
            name = v.get("name") or v.get("short") or v.get("vaccine_short")
            if name:
                out.append(str(name).strip())
    return out[:5]


def handle_faq_vaccine(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
    history: list | None = None,
    **kwargs,
) -> ChatResponse:
    msg = (message or "").strip()
    if len(msg) <= 3 or (
        len(msg.split()) <= 2
        and len(msg) <= 12
        and not any(
            k in msg.lower()
            for k in (
                "hpv",
                "mmr",
                "bcg",
                "tdap",
                "adacel",
                "sởi",
                "cúm",
                "zona",
                "shingrix",
                "viêm gan",
                "uốn ván",
                "tiêm",
                "vaccine",
                "vắc",
                "covid",
                "lịch",
                "tuổi",
                "tháng",
                "mũi",
                "bệnh",
                "liều",
            )
        )
    ):
        from app.chatbot.handlers.fallback import handle_unknown

        return handle_unknown(message, session_id, conf)

    entities = entities or EntityExtractor().extract(message)
    vaccine_ids = list(entities.get("vaccine_ids") or [])
    vid = int(vaccine_ids[0]) if vaccine_ids else None
    vax_names = _normalize_vaccine_names(entities)
    disease_q = _is_disease_question(msg)

    # Follow-up: câu không nhắc tên vaccine nhưng orchestrator đã gắn vaccines từ memory
    retrieve_q = message
    if vax_names and not any(n.lower() in message.lower() for n in vax_names):
        retrieve_q = f"{message} {' '.join(vax_names[:2])}"

    eligibility = check_eligibility_from_text(message)
    eligibility_block = ""
    if eligibility.status in ("defer_suggested", "caution"):
        eligibility_block = format_eligibility_text(eligibility)

    retrieval = _try_retrieve(retrieve_q, vaccine_id=vid)
    hits = retrieval.get("hits") or []
    enough = bool(retrieval.get("enough_evidence"))

    sources: list[Source] = []
    context_parts: list[str] = []
    for h in hits[:5]:
        text = h.get("text") or h.get("chunk") or ""
        title = h.get("title") or h.get("doc_id") or "tài liệu"
        doc_id = str(h.get("doc_id") or title)[:64]
        tier = h.get("tier")
        context_parts.append(f"[{title}]\n{text[:500]}")
        sources.append(
            Source(
                doc_id=doc_id,
                title=str(title)[:120],
                tier=str(tier) if tier else None,
                snippet=(text[:180] + "…") if len(text) > 180 else text,
                url=h.get("url"),
                issuer=h.get("issuer"),
            )
        )

    if eligibility.status in ("defer_suggested", "caution"):
        sources.append(
            Source(
                doc_id="qd-1575-byt",
                title="Quyết định 1575/QĐ-BYT – Hướng dẫn khám sàng lọc trước tiêm",
                issuer="Bộ Y tế",
                tier="A",
            )
        )

    context_str = "\n\n".join(context_parts)
    actions: list[Action] = []
    if vid:
        actions.append(
            Action(
                type="OPEN_VACCINE",
                label="Xem chi tiết vaccine",
                vaccine_id=vid,
                path=f"/vaccines/{vid}",
            )
        )
    actions.append(
        Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
    )

    if disease_q:
        if not enough or not _context_has_etiology(context_str):
            reply = (
                "Mình chưa có tài liệu về nguyên nhân hay đường lây của bệnh này.\n\n"
                "Nếu cần phần tiêm phòng, bạn có thể hỏi:\n"
                f"{_disease_examples(msg)}"
            )
            return ChatResponse(
                reply=reply,
                intent="faq_vaccine",
                intent_confidence=conf,
                sources=[],
                actions=actions,
                session_id=session_id,
                meta={
                    "handler": "faq_vaccine",
                    "disease_question": True,
                    "enough_evidence": False,
                    "rejected_reason": "no_etiology_in_kb",
                    "eligibility": eligibility.to_dict(),
                    "followup_vaccines": vax_names,
                },
            )

    completed = _stated_completed_dose(msg)
    if completed is not None and vid is not None and (
        _asks_next_dose(msg) or _is_protocol_question(msg)
    ):
        try:
            from app.chatbot.rules.age_rules_loader import protocol_for_vaccine

            rows = protocol_for_vaccine(int(vid))
            next_dose = completed + 1
            next_rows = [r for r in rows if int(r.get("dose_number") or 0) == next_dose]
            interval = None
            note = ""
            for r in next_rows:
                try:
                    iv = r.get("interval_days_min")
                    if iv is not None and float(iv) > 0:
                        interval = int(float(iv))
                except (TypeError, ValueError):
                    pass
                note = (r.get("note") or note) or ""
            vlabel = vax_names[0] if vax_names else "vaccine"
            protect = ""
            for h in hits[:3]:
                tx = h.get("text") or ""
                if "type" in tx.lower() or "phòng" in tx.lower() or "HPV" in tx:
                    protect = tx[:220]
                    break
            parts = [
                f"Bạn cho biết đã tiêm {vlabel} mũi {completed} "
                f"(không nêu ngày tiêm cụ thể)."
            ]
            if interval:
                parts.append(
                    f"Theo phác đồ tham khảo, mũi {next_dose} thường cách mũi trước "
                    f"ít nhất {interval} ngày"
                    + (f" ({note})" if note else "")
                    + ". "
                    "Muốn biết lịch trên lịch của bạn, cần ngày tiêm mũi trước "
                    "(hoặc hồ sơ trên VaxCare)."
                )
            elif next_rows:
                parts.append(
                    f"Có mốc mũi {next_dose} trong bảng quy tắc"
                    + (f": {note}" if note else "")
                    + ". Cần ngày tiêm mũi trước để tính lịch cụ thể."
                )
            else:
                parts.append(
                    f"Trong bảng quy tắc hiện có chưa rõ khoảng cách tới mũi {next_dose}. "
                    "Bạn hỏi nhân viên y tế hoặc xem tờ hướng dẫn sản phẩm."
                )
            if protect and (
                "type" in msg.lower() or "phòng" in msg.lower() or "type" in msg
            ):
                parts.append("Về phòng bệnh / type (theo tài liệu): " + protect)
            elif (
                "type" in msg.lower()
                or "phòng type" in msg.lower()
                or "phòng bệnh" in msg.lower()
            ):
                if protect:
                    parts.append(protect)
                else:
                    parts.append(
                        "Chi tiết type HPV phòng được phụ thuộc loại vắc xin (Gardasil…); "
                        "xem trang vaccine hoặc HDSD tại cơ sở."
                    )
            reply = "\n\n".join(parts)
            return ChatResponse(
                reply=reply,
                intent="faq_vaccine",
                intent_confidence=conf,
                sources=sources,
                actions=actions,
                session_id=session_id,
                meta={
                    "handler": "faq_vaccine",
                    "completed_dose": completed,
                    "next_dose": next_dose,
                    "interval_days_min": interval,
                    "no_invented_date": True,
                    "followup_vaccines": vax_names,
                },
            )
        except Exception as e:
            logger.warning("next-dose rule failed: %s", e)

    if (_is_protocol_question(msg) or _is_confirm_followup(msg)) and vid is not None:
        try:
            from app.chatbot.rules.age_rules_loader import (
                format_protocol_text,
                protocol_for_vaccine,
            )

            rows = protocol_for_vaccine(int(vid))
            if rows:
                vlabel = (
                    vax_names[0]
                    if vax_names
                    else (
                        rows[0].get("vaccine_short") or f"vaccine_id={vid}"
                    )
                )
                known = [
                    str(r.get("source_doc") or "") for r in rows if r.get("source_doc")
                ]
                known = [k for k in known if k] or [
                    "Thông tư 10/2024/TT-BYT",
                    "khuyến cáo WHO",
                ]

                # Câu xác nhận / follow-up ngắn → trả lời ngắn, không dump full lịch
                if _is_confirm_followup(msg) or (
                    len(msg) <= 100
                    and re.search(
                        r"(vậy là|thế là|phải không|đúng không|người lớn|lớn tuổi|"
                        r"2\s*liều|3\s*liều)",
                        msg.lower(),
                    )
                    and not re.search(r"(chi tiết|đầy đủ|từng mũi|toàn bộ)", msg.lower())
                ):
                    summary = _short_protocol_summary(
                        rows, str(vlabel), question=msg,
                        is_confirm=_is_confirm_followup(msg),
                    )
                    if not sources:
                        for k in known[:3]:
                            sources.append(
                                Source(
                                    doc_id=k[:32],
                                    title=k,
                                    tier="B",
                                    issuer="Bộ Y tế / WHO",
                                )
                            )
                    return ChatResponse(
                        reply=summary,
                        intent="faq_vaccine",
                        intent_confidence=conf,
                        sources=sources,
                        actions=actions,
                        session_id=session_id,
                        meta={
                            "handler": "faq_vaccine",
                            "protocol": True,
                            "protocol_style": "short",
                            "vaccine_id": vid,
                            "followup_vaccines": vax_names,
                        },
                    )

                protocol_txt = format_protocol_text(rows, str(vlabel))
                # Bỏ markdown ** nếu loader còn in
                protocol_txt = protocol_txt.replace("**", "")
                reply_body = protocol_txt
                known_guard = known
                guarded = enforce_guardrails(
                    reply_body,
                    require_source_hint=True,
                    known_sources=known_guard,
                    question=message,
                )
                if not sources:
                    for k in known[:3]:
                        sources.append(
                            Source(
                                doc_id=k[:32],
                                title=k,
                                tier="A",
                                issuer="Bộ Y tế / WHO",
                            )
                        )
                return ChatResponse(
                    reply=guarded.text,
                    intent="faq_vaccine",
                    intent_confidence=conf,
                    sources=sources,
                    actions=actions,
                    session_id=session_id,
                    meta={
                        "handler": "faq_vaccine",
                        "protocol": True,
                        "protocol_style": "full",
                        "vaccine_id": vid,
                        "n_rules": len(rows),
                        "guard_warnings": guarded.warnings,
                        "followup_vaccines": vax_names,
                    },
                )
        except Exception as e:
            logger.warning("protocol_for_vaccine failed: %s", e)

    if not enough and not context_str and eligibility.status == "ok_to_discuss":
        hint = ""
        if vax_names:
            hint = f" (đang theo chủ đề {', '.join(vax_names[:2])})"
        reply = (
            "Mình chưa tìm đủ tài liệu khớp câu hỏi"
            + hint
            + ". Bạn thử nêu rõ tên vaccine (HPV, viêm gan B, sởi, COVID…)."
        )
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=[],
            actions=actions,
            session_id=session_id,
            meta={
                "handler": "faq_vaccine",
                "enough_evidence": False,
                "rejected_reason": retrieval.get("rejected_reason"),
                "eligibility": eligibility.to_dict(),
                "followup_vaccines": vax_names,
            },
        )

    if eligibility.status == "defer_suggested" and not enough:
        reply = (
            eligibility_block
            + "\n\nChatbot không kết luận chống chỉ định tuyệt đối. "
            "Vui lòng khám sàng lọc tại cơ sở tiêm chủng trước khi tiêm."
        )
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=sources,
            actions=actions,
            session_id=session_id,
            safe_mode=True,
            meta={
                "handler": "faq_vaccine",
                "enough_evidence": False,
                "eligibility": eligibility.to_dict(),
            },
        )

    messages = build_messages(
        "faq_vaccine",
        question=message,
        context=context_str,
        rule_result=eligibility_block,
        history=history,
    )
    try:
        raw = get_llm_client().generate(messages)
    except Exception as e:
        logger.warning("LLM generate failed in faq: %s", e)
        raw = ""

    known = [s.title for s in sources if s.title]
    guarded = enforce_guardrails(
        raw if raw else (
            context_str[:800]
            if context_str
            else "Chưa đủ tài liệu để trả lời chính xác. Bạn thử nêu rõ tên vaccine."
        ),
        require_source_hint=True,
        known_sources=known,
        question=message,
    )

    return ChatResponse(
        reply=guarded.text,
        intent="faq_vaccine",
        intent_confidence=conf,
        sources=sources,
        actions=actions,
        session_id=session_id,
        safe_mode=eligibility.needs_clinician,
        meta={
            "handler": "faq_vaccine",
            "disease_question": disease_q,
            "enough_evidence": enough,
            "n_hits": len(hits),
            "max_score": retrieval.get("max_score"),
            "raw_max_score": retrieval.get("raw_max_score"),
            "rejected_reason": retrieval.get("rejected_reason"),
            "guard_warnings": guarded.warnings,
            "eligibility": eligibility.to_dict(),
            "followup_vaccines": vax_names,
            "retrieve_q": retrieve_q[:120],
        },
    )