from __future__ import annotations

from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.chatbot.rules.history_checker import check_history, format_history_text
from app.schemas.chat import Action, ChatResponse, Source


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
    records = ctx.get("records")

    sources: list[Source] = []
    actions: list[Action] = [
        Action(type="OPEN_HISTORY", label="Xem lịch sử tiêm", path="/history")
    ]

    if age_months is None and age_years is None and not records:
        reply = (
            "Để đối chiếu lịch sử tiêm, mình cần hồ sơ trong tài khoản đăng nhập "
            "hoặc bạn cho biết độ tuổi và các mũi đã tiêm (tên vaccine + số mũi). "
            "Bạn có thể mở mục Lịch sử tiêm trên VaxCare."
        )
        return ChatResponse(
            reply=reply,
            intent="history_lookup",
            intent_confidence=conf,
            actions=actions,
            session_id=session_id,
            meta={"handler": "history_lookup", "need_profile": True},
        )

    if age_months is None and age_years is None:
        age_years = 20  
    result = check_history(
        age_months=age_months,
        age_years=age_years,
        records=records,
    )
    rule_text = format_history_text(result)

    messages = build_messages(
        "history_lookup",
        question=message,
        rule_result=rule_text,
    )
    raw = get_llm_client().generate(messages)
    guarded = enforce_guardrails(
        raw if raw and len(raw) > 40 else rule_text,
        require_source_hint=True,
        known_sources=result.sources,
    )

    for s in result.sources[:3]:
        sources.append(Source(doc_id=s[:32], title=s, tier="A"))

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
            "n_completed": len(result.completed),
            "n_next": len(result.next_steps),
            "guard_warnings": guarded.warnings,
        },
    )
