from __future__ import annotations

import logging
from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.core.config import settings
from app.schemas.chat import Action, ChatResponse, Source

logger = logging.getLogger(__name__)


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


def handle_faq_vaccine(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
) -> ChatResponse:
    entities = entities or EntityExtractor().extract(message)
    vaccine_ids = entities.get("vaccine_ids") or []
    vid = vaccine_ids[0] if vaccine_ids else None

    retrieval = _try_retrieve(message, vaccine_id=vid)
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
            )
        )

    context_str = "\n\n---\n\n".join(context_parts) if context_parts else ""

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

    if not enough and not context_str:
        reply = (
            "Hiện kho tài liệu chưa đủ đoạn khớp với câu hỏi này để trả lời có căn cứ. "
            "Bạn thử nêu rõ tên vaccine hoặc bệnh cần phòng (ví dụ HPV, viêm gan B, sởi). "
            "Hoặc hỏi nhân viên y tế / xem tờ hướng dẫn sử dụng tại cơ sở tiêm."
        )
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=[],
            actions=actions,
            session_id=session_id,
            meta={"handler": "faq_vaccine", "enough_evidence": False},
        )

    messages = build_messages(
        "faq_vaccine",
        question=message,
        context=context_str,
    )
    raw = get_llm_client().generate(messages)
    known = [s.title for s in sources if s.title]
    guarded = enforce_guardrails(
        raw,
        require_source_hint=True,
        known_sources=known,
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
            "enough_evidence": enough,
            "n_hits": len(hits),
            "max_score": retrieval.get("max_score"),
            "guard_warnings": guarded.warnings,
        },
    )
