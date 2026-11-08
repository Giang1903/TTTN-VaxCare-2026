from __future__ import annotations

import re
from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.chatbot.rules.history_checker import check_history, format_history_text
from app.schemas.chat import Action, ChatResponse, Source


def _is_upcoming_question(message: str) -> bool:
    t = (message or "").lower()
    return bool(
        re.search(
            r"(sắp tới|lịch hẹn|lịch tiêm sắp|mũi tiêm sắp|các mũi.*sắp|"
            r"mũi (sắp|còn) tiêm|có lịch tiêm|appointment|"
            r"kiểm tra (các )?mũi tiêm sắp|lịch của (tôi|mình).*(sắp|tới))",
            t,
        )
    )


def _is_completed_question(message: str) -> bool:
    t = (message or "").lower()
    return bool(
        re.search(
            r"(đã tiêm|tiêm những|tiêm gì rồi|mũi đã tiêm|vaccine đã tiêm|"
            r"lịch sử tiêm|hồ sơ tiêm|tôi đã tiêm)",
            t,
        )
    )


def _fmt_record(r: dict[str, Any]) -> str:
    name = r.get("vaccine_name") or r.get("vaccine_short") or f"Vaccine #{r.get('vaccine_id', '?')}"
    dose = r.get("dose_number")
    date = r.get("injection_date") or ""
    result = r.get("result") or ""
    parts = [f"• {name}"]
    if dose is not None:
        parts.append(f"mũi {dose}")
    if date:
        parts.append(f"ngày {date}")
    if result and str(result).upper() != "SUCCESS":
        parts.append(f"({result})")
    return " — ".join(parts) if len(parts) > 1 else parts[0]


def _fmt_appointment(a: dict[str, Any]) -> str:
    name = a.get("vaccine_name") or f"Vaccine #{a.get('vaccine_id', '?')}"
    date = a.get("appointment_date") or a.get("date") or ""
    slot = a.get("time_slot") or a.get("time") or ""
    facility = a.get("facility_name") or a.get("facility") or ""
    status = a.get("status") or ""
    bits = [f"• {name}"]
    if date:
        bits.append(str(date))
    if slot:
        bits.append(str(slot)[:5] if len(str(slot)) >= 5 else str(slot))
    if facility:
        bits.append(str(facility))
    if status:
        bits.append(f"[{status}]")
    return " — ".join(bits)


def _reply_from_records(records: list[dict[str, Any]]) -> str:
    if not records:
        return (
            "Trong hồ sơ VaxCare hiện **chưa ghi nhận mũi tiêm nào**.\n\n"
            "Nếu bạn đã tiêm ở nơi khác, bổ sung qua mục Lịch sử tiêm "
            "hoặc đặt lịch mũi mới trên hệ thống."
        )
    lines = ["Trong hồ sơ VaxCare của bạn đã ghi nhận các mũi sau:\n"]
    # mới nhất trước nếu có ngày
    sorted_recs = sorted(
        records,
        key=lambda r: str(r.get("injection_date") or ""),
        reverse=True,
    )
    for r in sorted_recs:
        lines.append(_fmt_record(r))
    lines.append(
        "\nĐây là dữ liệu trên hệ thống VaxCare, không phải lịch tiêm chủng mẫu."
    )
    return "\n".join(lines)


def _reply_from_upcoming(appointments: list[dict[str, Any]]) -> str:
    # chỉ lịch chưa hủy / chưa hoàn thành
    active = [
        a
        for a in appointments
        if str(a.get("status") or "").upper()
        not in {"CANCELLED", "COMPLETED", "NO_SHOW", "ĐÃ HỦY", "ĐÃ TIÊM"}
    ]
    if not active:
        if appointments:
            return (
                "Bạn **không có lịch tiêm sắp tới** (các lịch còn lại đã tiêm hoặc đã hủy).\n\n"
                "Bạn có thể đặt lịch mới tại mục Đặt lịch trên VaxCare."
            )
        return (
            "Hiện **chưa có lịch hẹn sắp tới** trên tài khoản của bạn.\n\n"
            "Mở Đặt lịch để chọn vaccine, cơ sở và khung giờ."
        )
    lines = ["Lịch tiêm **sắp tới** trên tài khoản của bạn:\n"]
    for a in active:
        lines.append(_fmt_appointment(a))
    lines.append(
        "\nNếu cần đổi/hủy lịch, vào mục Lịch tiêm trên VaxCare hoặc liên hệ cơ sở."
    )
    return "\n".join(lines)


def handle_history_lookup(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
) -> ChatResponse:
    ctx = context or {}
    entities = entities or EntityExtractor().extract(message)

    age_months = ctx.get("age_months") or entities.get("age_months")
    age_years = ctx.get("age_years") or entities.get("age_years")
    records = ctx.get("records") or ctx.get("vaccination_records") or []
    if not isinstance(records, list):
        records = []
    upcoming = ctx.get("upcoming_appointments") or ctx.get("appointments") or []
    if not isinstance(upcoming, list):
        upcoming = []

    actions: list[Action] = [
        Action(type="OPEN_HISTORY", label="Xem lịch sử tiêm / Tra hồ sơ", path="/history")
    ]
    sources: list[Source] = []  # trả lời từ DB hệ thống → không gắn nguồn BYT giả

    # --- Lịch sắp tới: chỉ dùng appointment trên hệ thống ---
    if _is_upcoming_question(message):
        if not ctx.get("user_id") and not upcoming:
            reply = (
                "Để xem **lịch tiêm sắp tới**, bạn cần đăng nhập tài khoản VaxCare.\n\n"
                "Sau khi đăng nhập, hỏi lại «Lịch tiêm sắp tới của tôi»."
            )
            return ChatResponse(
                reply=reply,
                intent="history_lookup",
                intent_confidence=conf,
                sources=[],
                actions=actions
                + [Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")],
                session_id=session_id,
                meta={"handler": "history_lookup", "mode": "upcoming_need_login"},
            )
        reply = _reply_from_upcoming(upcoming)
        return ChatResponse(
            reply=reply,
            intent="history_lookup",
            intent_confidence=conf,
            sources=[],
            actions=actions
            + [Action(type="OPEN_BOOKING", label="Đặt lịch mũi tiếp theo", path="/booking")],
            session_id=session_id,
            meta={"handler": "history_lookup", "mode": "upcoming", "count": len(upcoming)},
        )

    # --- Đã tiêm những gì: liệt kê records, không LLM bịa ---
    if _is_completed_question(message):
        if not ctx.get("user_id") and not records:
            reply = (
                "Để xem **các mũi đã tiêm**, bạn cần đăng nhập tài khoản VaxCare "
                "hoặc cho biết rõ (ví dụ: «Tôi đã tiêm HPV mũi 1 ngày 01/2026»)."
            )
            return ChatResponse(
                reply=reply,
                intent="history_lookup",
                intent_confidence=conf,
                sources=[],
                actions=actions,
                session_id=session_id,
                meta={"handler": "history_lookup", "mode": "completed_need_login"},
            )
        reply = _reply_from_records(records)
        return ChatResponse(
            reply=reply,
            intent="history_lookup",
            intent_confidence=conf,
            sources=[],
            actions=actions,
            session_id=session_id,
            meta={"handler": "history_lookup", "mode": "completed", "count": len(records)},
        )

    # --- Không có hồ sơ / chưa login: không mặc định tuổi 20 ---
    if age_months is None and age_years is None and not records:
        reply = (
            "Để đối chiếu hồ sơ tiêm của bạn, hãy **đăng nhập** VaxCare "
            "hoặc cho biết tuổi và mũi đã tiêm (ví dụ: HPV mũi 1).\n\n"
            "Mình không dùng lịch mẫu chung khi chưa có dữ liệu của bạn."
        )
        return ChatResponse(
            reply=reply,
            intent="history_lookup",
            intent_confidence=conf,
            sources=[],
            actions=actions,
            session_id=session_id,
            meta={"handler": "history_lookup", "need_profile": True},
        )

    # --- Hỏi «còn thiếu gì / nên tiêm tiếp» → rule engine (có records thật) ---
    if age_months is None and age_years is None:
        age_years = 20

    result = check_history(
        age_months=age_months,
        age_years=age_years,
        records=records,
    )
    rule_text = format_history_text(result)

    # Ưu tiên rule_text; LLM chỉ diễn đạt lại, không bịa nguồn ngoài result.sources
    messages = build_messages(
        "history_lookup",
        question=message,
        rule_result=rule_text,
    )
    try:
        raw = get_llm_client().generate(messages)
    except Exception:
        raw = ""

    base = rule_text
    if raw and len(raw.strip()) > 40:
        # Chỉ dùng LLM nếu không mâu thuẫn hoàn toàn — vẫn neo rule_text
        base = rule_text + "\n\n" + raw.strip()

    # Gắn rõ đây là đối chiếu hồ sơ hệ thống
    if records:
        rec_block = _reply_from_records(records)
        base = rec_block + "\n\n— Đối chiếu gợi ý tiếp theo —\n" + rule_text

    guarded = enforce_guardrails(
        base,
        require_source_hint=False,
        known_sources=list(result.sources or []),
    )

    for s in (result.sources or [])[:3]:
        sources.append(Source(doc_id=str(s)[:32], title=str(s), tier="A"))

    if result.next_steps:
        actions.append(
            Action(type="OPEN_BOOKING", label="Đặt lịch mũi tiếp theo", path="/booking")
        )

    return ChatResponse(
        reply=guarded.text,
        intent="history_lookup",
        intent_confidence=conf,
        sources=sources,
        actions=actions,
        session_id=session_id,
        meta={
            "handler": "history_lookup",
            "mode": "gap_analysis",
            "has_records": bool(records),
            "completed": len(result.completed),
            "missing": len(result.missing),
        },
    )
