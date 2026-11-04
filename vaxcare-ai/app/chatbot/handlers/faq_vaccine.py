from __future__ import annotations

import logging
from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.chatbot.rules.eligibility import (
    check_eligibility_from_text,
    format_eligibility_text,
)
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
    msg = (message or "").strip()
    if len(msg) <= 3 or (len(msg.split()) <= 2 and len(msg) <= 12 and not any(
        k in msg.lower()
        for k in (
            "hpv", "mmr", "bcg", "tdap", "adacel", "sởi", "cúm", "zona",
            "shingrix", "viêm gan", "uốn ván", "tiêm", "vaccine", "vắc",
            "lịch", "tuổi", "tháng", "mũi",
        )
    )):
        from app.chatbot.handlers.fallback import handle_unknown
        return handle_unknown(message, session_id, conf)

    entities = entities or EntityExtractor().extract(message)
    vaccine_ids = entities.get("vaccine_ids") or []
    vid = vaccine_ids[0] if vaccine_ids else None

    eligibility = check_eligibility_from_text(message)
    eligibility_block = ""
    if eligibility.status in ("defer_suggested", "caution"):
        eligibility_block = format_eligibility_text(eligibility)

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

    if eligibility.status in ("defer_suggested", "caution"):
        sources.append(
            Source(
                doc_id="qd-1575-byt",
                title="Quyết định 1575/QĐ-BYT – Hướng dẫn khám sàng lọc trước tiêm",
                issuer="Bộ Y tế",
                tier="A",
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

    if not enough and not context_str and eligibility.status == "ok_to_discuss":
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
            meta={
                "handler": "faq_vaccine",
                "enough_evidence": False,
                "rejected_reason": retrieval.get("rejected_reason"),
                "eligibility": eligibility.to_dict(),
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
        safe_mode=eligibility.needs_clinician,
        meta={
            "handler": "faq_vaccine",
            "enough_evidence": enough,
            "n_hits": len(hits),
            "max_score": retrieval.get("max_score"),
            "raw_max_score": retrieval.get("raw_max_score"),
            "rejected_reason": retrieval.get("rejected_reason"),
            "guard_warnings": guarded.warnings,
            "eligibility": eligibility.to_dict(),
        },
    )
