from __future__ import annotations

from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.chatbot.rules.schedule_engine import advise_schedule, format_schedule_text
from app.schemas.chat import Action, ChatResponse, Source


def handle_schedule_advice(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
) -> ChatResponse:
    entities = entities or EntityExtractor().extract(message)
    ctx = context or {}

    age_months = entities.get("age_months") or ctx.get("age_months")
    age_years = entities.get("age_years") or ctx.get("age_years")

    sources: list[Source] = []
    actions: list[Action] = []

    if age_months is None and age_years is None:
        reply = (
            "Để gợi ý mốc tiêm, bạn cho mình biết độ tuổi (ví dụ «20 tuổi» hoặc «14 tháng») "
            "và nếu có, các mũi đã tiêm. "
            "Mình sẽ đối chiếu với lịch tham khảo (Thông tư 10/2024 và khuyến cáo liên quan)."
        )
        sources.append(
            Source(
                doc_id="tt10-2024",
                title="Thông tư 10/2024/TT-BYT",
                issuer="Bộ Y tế",
                tier="A",
            )
        )
        return ChatResponse(
            reply=reply,
            intent="schedule_advice",
            intent_confidence=conf,
            sources=sources,
            session_id=session_id,
            meta={"handler": "schedule_advice", "need_age": True},
        )

    completed = set()
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
    )
    rule_text = format_schedule_text(result)

    messages = build_messages(
        "schedule_advice",
        question=message,
        rule_result=rule_text,
    )
    raw = get_llm_client().generate(messages)
    guarded = enforce_guardrails(
        raw if raw and len(raw) > 40 else rule_text,
        require_source_hint=True,
        known_sources=result.sources,
    )
    reply = guarded.text

    for s in result.sources[:4]:
        sources.append(
            Source(
                doc_id=s.lower().replace(" ", "-")[:40],
                title=s,
                issuer="Bộ Y tế / WHO" if "TT" in s or "WHO" in s else None,
                tier="A" if "TT 10" in s or "TT10" in s else "B",
            )
        )

    actions.append(
        Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
    )

    return ChatResponse(
        reply=reply,
        intent="schedule_advice",
        intent_confidence=conf,
        sources=sources,
        actions=actions,
        session_id=session_id,
        meta={
            "handler": "schedule_advice",
            "age_months": result.age_months,
            "n_recommendations": len(result.recommendations),
            "guard_warnings": guarded.warnings,
        },
    )
