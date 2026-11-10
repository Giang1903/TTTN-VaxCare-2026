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
            return f"• {e1}\n• {e2}"
    return "• Vaccine phòng bệnh gì?\n• Tiêm mấy mũi / ai nên tiêm?"


def _is_protocol_question(text: str) -> bool:
    t = (text or "").lower()
    return bool(
        re.search(
            r"(phác\s*đồ|lịch\s*tiêm|bao nhiêu\s*mũi|mấy\s*mũi|tiêm\s*bao nhiêu|"
            r"cần\s*tiêm\s*(mấy|bao nhiêu)|liều\s*trình|mấy\s*liều|bao nhiêu\s*liều|"
            r"khoảng\s*cách.*mũi|tiêm\s*vào\s*lúc\s*nào|schedule|tiêm\s*như\s*nào)",
            t,
        )
    )


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
            )
        )
    ):
        from app.chatbot.handlers.fallback import handle_unknown

        return handle_unknown(message, session_id, conf)

    entities = entities or EntityExtractor().extract(message)
    vaccine_ids = entities.get("vaccine_ids") or []
    vid = vaccine_ids[0] if vaccine_ids else None
    disease_q = _is_disease_question(msg)

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
                },
            )

    
    if _is_protocol_question(msg) and vid is not None:
        try:
            from app.chatbot.rules.age_rules_loader import (
                format_protocol_text,
                protocol_for_vaccine,
            )

            rows = protocol_for_vaccine(int(vid))
            if rows:
                vlabel = (
                    (entities.get("vaccines") or [{}])[0].get("name")
                    or rows[0].get("vaccine_short")
                    or f"vaccine_id={vid}"
                )
                protocol_txt = format_protocol_text(rows, str(vlabel))
                extra_bits = []
                for h in hits[:5]:
                    vids = h.get("vaccine_ids") or []
                    if int(vid) in [int(x) for x in vids if str(x).isdigit()] or int(vid) in vids:
                        snip = (h.get("text") or "")[:280]
                        title = h.get("title") or h.get("doc_id") or ""
                        if snip:
                            extra_bits.append(f"- {title}: {snip}")
                reply_body = protocol_txt
                if extra_bits:
                    reply_body += "\n\nGhi chú từ tài liệu cùng vaccine:\n" + "\n".join(extra_bits[:2])
                known = [str(r.get("source_doc") or "") for r in rows if r.get("source_doc")]
                known = [k for k in known if k] or ["Thông tư 10/2024/TT-BYT", "khuyến cáo WHO"]
                guarded = enforce_guardrails(
                    reply_body,
                    require_source_hint=True,
                    known_sources=known,
                    question=message,
                )
                if not sources:
                    for k in known[:3]:
                        sources.append(
                            Source(doc_id=k[:32], title=k, tier="A", issuer="Bộ Y tế / WHO")
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
                        "vaccine_id": vid,
                        "n_rules": len(rows),
                        "guard_warnings": guarded.warnings,
                    },
                )
        except Exception as e:
            logger.warning("protocol_for_vaccine failed: %s", e)

    if not enough and not context_str and eligibility.status == "ok_to_discuss":
        reply = (
            "Mình chưa tìm đủ tài liệu khớp câu hỏi. "
            "Bạn thử nêu rõ tên vaccine (HPV, viêm gan B, sởi, COVID…)."
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
        history=history,
    )
    try:
        raw = get_llm_client().generate(messages)
    except Exception as e:
        logger.warning("LLM generate failed in faq: %s", e)
        raw = ""

    known = [s.title for s in sources if s.title]
    guarded = enforce_guardrails(
        raw,
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
        },
    )
