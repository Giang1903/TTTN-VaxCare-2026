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
    """Regex fallback — thứ tự: cụ thể trước, chung sau."""
    t = text.lower().strip()

    if re.search(
        r"(đau ngực|khó thở|cấp cứu|co giật|sốc phản vệ|chẩn đoán|"
        r"uống thuốc gì|kê đơn|thời tiết|bóng đá|cho chó|thú cưng)",
        t,
    ):
        return "out_of_scope", 0.9

    if re.search(
        r"^(chào|hello|hi|hey|xin chào|cảm ơn|thanks|thank you|"
        r"tạm biệt|bye|goodbye|bạn khỏe không)[\s!.?]*$",
        t,
    ) or t in {"ok", "oke", "được rồi", "thanks", "bye", "chào bạn"}:
        return "chitchat", 0.92

    if re.search(
        r"((có|còn)\s*(vaccine|vaccin|vắc\s*xin|vắc-xin)|"
        r"bên bạn có|bên mình có|cửa hàng có|đang có.*vaccine|"
        r"vaccine.*không\s*\?|vaccin.*không)",
        t,
    ) or re.search(
        r"(đặt lịch|mở trang|chi tiết vaccine|tìm cơ sở|cơ sở tiêm|"
        r"phòng khám|đăng ký tiêm|tra cứu cơ sở|hướng dẫn đặt lịch|"
        r"gần đây|ở đâu tiêm)",
        t,
    ):
        return "vaxcare_lookup", 0.90

    # Hồ sơ / lịch hẹn cá nhân trên hệ thống (ưu tiên cao, trước schedule_advice)
    if re.search(
        r"(lịch sử tiêm|hồ sơ tiêm|đã tiêm|tiêm những|tiêm gì rồi|tiêm mũi \d|"
        r"quên đã tiêm|xem lịch sử|dữ liệu tiêm đã ghi|"
        r"lịch tiêm của (tôi|mình|em|bé)|lịch hẹn của (tôi|mình)|"
        r"hồ sơ của (tôi|mình)|đối chiếu hồ sơ|"
        r"sắp tới|lịch hẹn|lịch tiêm sắp|mũi tiêm sắp|các mũi.*sắp|"
        r"kiểm tra (lịch|các mũi|mũi tiêm)|có lịch tiêm (gì|không)|"
        r"appointment)",
        t,
    ):
        return "history_lookup", 0.95

    if re.search(
        r"(nguyên\s*nhân|lý\s*do\s*(mắc|bệnh)|đường\s*lây|triệu\s*chứng|"
        r"vì\s*sao\s*(mắc|bị|nhiễm))",
        t,
    ):
        return "faq_vaccine", 0.88

    if re.search(
        r"(phòng bệnh gì|công dụng|tác dụng|chống chỉ định|chỉ định|"
        r"ai nên tiêm|đối tượng|liều lượng|tiêm đường nào|bao nhiêu ml|"
        r"tác dụng phụ|tác dụng không mong muốn|có an toàn|"
        r"sống hay bất hoạt|type hpv|phòng type|"
        r"phác\s*đồ|bao nhiêu\s*mũi|mấy\s*mũi)",
        t,
    ):
        return "faq_vaccine", 0.85

    if re.search(
        r"(\d+\s*tuổi|\d+\s*tháng|sơ sinh|bao nhiêu tuổi|lộ trình|"
        r"mốc tiêm|tiêm những (mũi|vaccine)|tiêm gì|nhắc những|"
        r"lịch (tiêm|tcmr|hpv|shingrix|zona|sởi|je|cúm)|"
        r"khi nào tiêm|khoảng cách.*mũi|"
        r"tiêm bù|trẻ \d+)",
        t,
    ):
        return "schedule_advice", 0.8

    if re.search(
        r"(vaccine|vaccin|vắc xin|vắc-xin|bcg|bbg|hpv|mmr|sởi|cúm|"
        r"shingrix|zona|prevenar|varivax|viêm gan|uốn ván|dại|rabies|"
        r"covid|sars-cov|ncov)",
        t,
    ):
        return "faq_vaccine", 0.70

    return "faq_vaccine", 0.4


def _guess_intent(text: str) -> tuple[str, float]:
    reg_label, reg_conf = _guess_intent_regex(text)
    if reg_conf >= 0.88:
        return reg_label, reg_conf

    clf = _get_classifier()
    if clf is not None:
        label, conf = clf.predict(text)
        if label == "chitchat" and reg_label != "chitchat" and reg_conf >= 0.65:
            return reg_label, max(reg_conf, 0.75)
        if not clf.is_confident(conf):
            if reg_conf >= conf:
                return reg_label, reg_conf
            return label, conf
        if reg_conf >= 0.8 and label != reg_label and conf < 0.75:
            return reg_label, reg_conf
        return label, conf
    return reg_label, reg_conf


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
