from __future__ import annotations

import logging
import re
import uuid
from pathlib import Path
from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.handlers import (
    handle_chitchat,
    handle_faq_vaccine,
    handle_history_lookup,
    handle_out_of_scope,
    handle_schedule_advice,
    handle_unknown,
    handle_vaxcare_lookup,
)
from app.chatbot.intent.labels import INTENT_LABELS
from app.chatbot.intent.safety import check_safety
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

_clf = None
_CLF_PATH = Path(__file__).resolve().parents[2] / "models" / "intent_clf.joblib"
_extractor = EntityExtractor()


def _get_classifier():
    global _clf
    if _clf is not None:
        return _clf
    if not _CLF_PATH.exists():
        return None
    try:
        from app.chatbot.intent.classifier import IntentClassifier

        _clf = IntentClassifier.load(_CLF_PATH)
        logger.info("Loaded intent classifier from %s", _CLF_PATH)
    except Exception as e:
        logger.warning("Cannot load intent classifier: %s", e)
        _clf = None
    return _clf


def _guess_intent_regex(text: str) -> tuple[str, float]:
    t = text.lower().strip()
    if re.search(r"\b(chào|hello|hi|cảm ơn|thanks|xin chào)\b", t):
        return "chitchat", 0.9
    if re.search(r"(lịch sử|đã tiêm|mũi \d|hồ sơ tiêm|tiêm mũi)", t):
        return "history_lookup", 0.75
    if re.search(r"(đặt lịch|cơ sở|phòng khám|ở đâu|đăng ký tiêm|tra cứu cơ sở)", t):
        return "vaxcare_lookup", 0.75
    if re.search(r"(\d+\s*tuổi|\d+\s*tháng|bao nhiêu tuổi|lộ trình|mốc tiêm|tiêm gì|nên tiêm)", t):
        return "schedule_advice", 0.7
    if re.search(r"(đau ngực|khó thở|cấp cứu|chẩn đoán|uống thuốc gì)", t):
        return "out_of_scope", 0.85
    if re.search(r"(vaccine|vắc xin|vắc-xin|phòng bệnh|tác dụng|chống chỉ định|hpv|sởi|cúm)", t):
        return "faq_vaccine", 0.7
    return "faq_vaccine", 0.4


def _guess_intent(text: str) -> tuple[str, float]:
    clf = _get_classifier()
    if clf is not None:
        label, conf = clf.predict(text)
        if not clf.is_confident(conf):
            reg_label, reg_conf = _guess_intent_regex(text)
            if reg_conf >= conf:
                return reg_label, reg_conf
        return label, conf
    return _guess_intent_regex(text)


def _normalize_context(req: ChatRequest) -> dict[str, Any]:
    """Gộp context từ request (BE Spring gửi hồ sơ tiêm)."""
    ctx: dict[str, Any] = dict(req.context or {})
    if req.user_id is not None:
        ctx.setdefault("user_id", req.user_id)
    records = ctx.get("records")
    if records is None and isinstance(ctx.get("vaccination_records"), list):
        records = ctx["vaccination_records"]
        ctx["records"] = records
    return ctx


def handle_chat(req: ChatRequest) -> ChatResponse:
    session_id = req.session_id or str(uuid.uuid4())
    message = (req.message or "").strip()

    safety = check_safety(message)
    if safety.level == "emergency":
        return handle_out_of_scope(
            message, session_id, 0.95, reason=safety.reason, emergency=True
        )
    if safety.level in ("diagnosis",) or (
        safety.force_intent == "out_of_scope" and safety.level != "ok"
    ):
        if safety.level != "ok":
            return handle_out_of_scope(
                message, session_id, 0.9, reason=safety.reason, emergency=False
            )

    intent, conf = _guess_intent(message)
    if safety.force_intent:
        intent = safety.force_intent

    if intent not in INTENT_LABELS:
        intent = "faq_vaccine"

    entities = _extractor.extract(message)
    context = _normalize_context(req)

    try:
        if intent == "chitchat":
            resp = handle_chitchat(message, session_id, conf)
        elif intent == "out_of_scope":
            resp = handle_out_of_scope(message, session_id, conf, reason=safety.reason)
        elif intent == "schedule_advice":
            resp = handle_schedule_advice(
                message, session_id, conf, context=context, entities=entities
            )
        elif intent == "history_lookup":
            resp = handle_history_lookup(
                message, session_id, conf, context=context, entities=entities
            )
        elif intent == "vaxcare_lookup":
            resp = handle_vaxcare_lookup(
                message, session_id, conf, context=context, entities=entities
            )
        elif intent == "faq_vaccine":
            resp = handle_faq_vaccine(
                message, session_id, conf, context=context, entities=entities
            )
        else:
            resp = handle_unknown(message, session_id, conf)
    except Exception as e:
        logger.exception("Handler error for intent=%s: %s", intent, e)
        resp = ChatResponse(
            reply=(
                "Xin lỗi, hệ thống gặp lỗi khi xử lý câu hỏi. "
                "Bạn thử lại sau hoặc liên hệ hỗ trợ VaxCare."
            ),
            intent=intent,
            intent_confidence=conf,
            session_id=session_id,
            safe_mode=True,
            meta={"error": str(e), "handler": "orchestrator"},
        )

    meta = dict(resp.meta or {})
    meta.setdefault("stage", "logic-llm")
    meta["safety_level"] = safety.level
    resp.meta = meta
    return resp
