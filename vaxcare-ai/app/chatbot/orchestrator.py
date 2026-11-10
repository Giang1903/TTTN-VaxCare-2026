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
from app.chatbot.memory import get_memory_store
from app.core.config import settings
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

        _clf = IntentClassifier.load(
            _CLF_PATH, min_confidence=settings.intent_min_confidence
        )
        logger.info(
            "Loaded intent classifier from %s (min_conf=%.2f)",
            _CLF_PATH,
            settings.intent_min_confidence,
        )
    except Exception as e:
        logger.warning("Cannot load intent classifier: %s", e)
        _clf = None
    return _clf


def _guess_intent_regex(text: str) -> tuple[str, float]:
    """Regex fallback — thứ tự: cụ thể / an toàn trước, chung sau.
    Sprint 1: patterns mạnh hơn, confidence cao hơn cho case rõ ràng.
    """
    t = text.lower().strip()

    if re.search(
        r"(đau ngực|khó thở|cấp cứu|co giật|sốc phản vệ|bất tỉnh|tím tái|"
        r"chẩn đoán|tôi bị bệnh gì|uống thuốc gì|kê đơn|cho tôi đơn|"
        r"thời tiết|bóng đá|chứng khoán|bitcoin|crypto|giá vàng|"
        r"cho chó|cho mèo|thú cưng|nấu ăn|học lập trình)",
        t,
    ):
        return "out_of_scope", 0.93

    if re.search(
        r"^(chào|hello|hi|hey|xin chào|cảm ơn|thanks|thank you|"
        r"tạm biệt|bye|goodbye|bạn khỏe không|ok|oke|okay|"
        r"ừ|ừm|vâng|được rồi|hi vaxcare|hello vaxcare)"
        r"[\s!.?]*$",
        t,
    ) or re.search(r"^(được rồi\s+)?(thank you|thanks|cảm ơn)\b", t) or t in {
        "ok",
        "oke",
        "okay",
        "được rồi",
        "thanks",
        "bye",
        "chào bạn",
        "alo",
        "hello",
        "hi vaxcare",
    }:
        return "chitchat", 0.94

    if re.search(
        r"((có|còn)\s*(vaccine|vaccin|vắc\s*xin|vắc-xin)|"
        r"bên bạn có|bên mình có|cửa hàng có|đang có.*vaccine|"
        r"vaccine.*không\s*\?|vaccin.*không)",
        t,
    ) or re.search(
        r"(đặt lịch|mở trang|chi tiết vaccine|tìm cơ sở|cơ sở tiêm|"
        r"phòng khám|đăng ký tiêm|tra cứu cơ sở|hướng dẫn đặt lịch|"
        r"gần đây|ở đâu tiêm|cơ sở nào)",
        t,
    ):
        return "vaxcare_lookup", 0.91

    if re.search(
        r"(lịch sử tiêm|hồ sơ tiêm|xem lịch sử|dữ liệu tiêm đã ghi|"
        r"đối chiếu hồ sơ|hồ sơ của (tôi|mình)|"
        r"lịch tiêm của (tôi|mình|em|bé)|lịch hẹn của (tôi|mình)|"
        r"lịch hẹn|appointment|"
        r"sắp tới|lịch tiêm sắp|mũi tiêm sắp|các mũi.*sắp|"
        r"mũi nào sắp|còn mũi nào|"
        r"tiêm gì rồi|quên đã tiêm|"
        r"tôi tiêm trễ|"
        r"(đã tiêm|tiêm) (mũi\s*)?\d+.*(tiếp theo|khi nào|mũi 2|mũi tiếp)|"
        r"tiêm.*mũi 1.*(tiếp theo|khi nào mũi 2))",
        t,
    ):
        return "history_lookup", 0.94

    if re.search(
        r"(nguyên\s*nhân|lý\s*do\s*(mắc|bệnh)|đường\s*lây|triệu\s*chứng|"
        r"vì\s*sao\s*(mắc|bị|nhiễm)|biểu hiện|lây truyền)",
        t,
    ):
        return "faq_vaccine", 0.90

    if re.search(
        r"(phòng bệnh gì|công dụng|tác dụng|chống chỉ định|chỉ định|"
        r"ai nên tiêm|đối tượng|liều lượng|tiêm đường nào|bao nhiêu ml|"
        r"tác dụng phụ|tác dụng không mong muốn|có an toàn|"
        r"sống hay bất hoạt|type hpv|phòng type|"
        r"phác\s*đồ|bao nhiêu\s*mũi|mấy\s*mũi|"
        r"khoảng cách.*mũi|mũi \d.*sau)",
        t,
    ):
        return "faq_vaccine", 0.88

    if re.search(
        r"(\d+\s*tuổi|\d+\s*tháng|sơ sinh|bao nhiêu tuổi|lộ trình|"
        r"mốc tiêm|tiêm những (mũi|vaccine)|tiêm gì theo|"
        r"lịch (tiêm|tcmr|hpv|shingrix|zona|sởi|je|cúm)|"
        r"khi nào (nên )?tiêm|tiêm bù|trẻ \d+|người lớn.*tiêm|"
        r"nên tiêm (vaccine|mũi) gì|kiểm tra.*vaccine nào|"
        r"tiêm những vaccine nào|theo TCMR|cùng lúc với|"
        r"(hiện giờ|bây giờ|lúc này).*(tiêm|vaccine)|"
        r"có thể tiêm (các )?(vaccine|mũi) gì|"
        r"nên tiêm gì|tiêm được (vaccine|mũi) gì)",
        t,
    ):
        return "schedule_advice", 0.86

    if re.search(
        r"((hiện giờ|bây giờ|lúc này|hiện tại).*(tiêm|vaccine|vắc)|"
        r"có thể tiêm (các )?(vaccine|mũi|vắc)|"
        r"nên tiêm (gì|những gì|vaccine gì|mũi gì)|"
        r"tiêm được (các )?(vaccine|mũi) gì|"
        r"các vaccine (nào )?(có thể|nên) tiêm|"
        r"tiêm những (gì|vaccine|mũi) (nào )?)",
        t,
    ):
        return "schedule_advice", 0.92

    if re.search(
        r"(vaccine|vaccin|vắc xin|vắc-xin|bcg|bbg|hpv|mmr|sởi|cúm|"
        r"shingrix|zona|prevenar|varivax|viêm gan|uốn ván|dại|rabies|"
        r"covid|sars-cov|ncov|tdap|adacel|hib|ipv|dtp)",
        t,
    ):
        return "faq_vaccine", 0.72

    return "faq_vaccine", 0.42


def _guess_intent(text: str) -> tuple[str, float]:
    """Hybrid: regex ưu tiên khi conf cao; classifier hỗ trợ khi regex yếu.
    Sprint 1: ngưỡng classifier lấy từ settings (0.62), regex bias mạnh hơn.
    """
    reg_label, reg_conf = _guess_intent_regex(text)

    if reg_conf >= 0.88:
        return reg_label, reg_conf

    clf = _get_classifier()
    if clf is not None:
        label, conf = clf.predict(text)

        if label == "chitchat" and reg_label != "chitchat" and reg_conf >= 0.65:
            return reg_label, max(reg_conf, 0.78)

        if not clf.is_confident(conf):
            if reg_conf >= conf:
                return reg_label, reg_conf
            return label, conf

        if reg_conf >= 0.80 and label != reg_label and conf < 0.78:
            return reg_label, reg_conf

        return label, conf

    return reg_label, reg_conf


def _normalize_context(req: ChatRequest) -> dict[str, Any]:
    """Gộp context từ request (BE Spring gửi hồ sơ tiêm) + soft context từ memory."""
    ctx: dict[str, Any] = dict(req.context or {})
    if req.user_id is not None:
        ctx.setdefault("user_id", req.user_id)
    records = ctx.get("records")
    if records is None and isinstance(ctx.get("vaccination_records"), list):
        records = ctx["vaccination_records"]
        ctx["records"] = records
    # Chuẩn hoá profile lồng nhau → age trên ctx nếu có
    profile = ctx.get("profile")
    if isinstance(profile, dict):
        for k in ("age_years", "age_months", "date_of_birth", "full_name"):
            if ctx.get(k) is None and profile.get(k) is not None:
                ctx[k] = profile[k]
    return ctx


def _merge_memory_soft_context(
    context: dict[str, Any], soft: dict[str, Any]
) -> dict[str, Any]:
    """Bổ sung age / vaccine_ids từ memory nếu request hiện tại thiếu."""
    out = dict(context)
    if out.get("age_years") is None and soft.get("age_years") is not None:
        out["age_years"] = soft["age_years"]
    if out.get("age_months") is None and soft.get("age_months") is not None:
        out["age_months"] = soft["age_months"]
    if not out.get("vaccine_ids") and soft.get("vaccine_ids"):
        out["vaccine_ids"] = soft["vaccine_ids"]
    return out


def handle_chat(req: ChatRequest) -> ChatResponse:
    session_id = req.session_id or str(uuid.uuid4())
    message = (req.message or "").strip()

    store = get_memory_store()
    mem = store.get(session_id)
    history = mem.history_for_prompt()

    safety = check_safety(message)
    if safety.level == "emergency":
        resp = handle_out_of_scope(
            message, session_id, 0.95, reason=safety.reason, emergency=True
        )
        store.add_turn(session_id, "user", message, intent="out_of_scope")
        store.add_turn(session_id, "assistant", resp.reply, intent=resp.intent)
        return resp

    if safety.level in ("diagnosis",) or (
        safety.force_intent == "out_of_scope" and safety.level != "ok"
    ):
        if safety.level != "ok":
            resp = handle_out_of_scope(
                message, session_id, 0.9, reason=safety.reason, emergency=False
            )
            store.add_turn(session_id, "user", message, intent="out_of_scope")
            store.add_turn(session_id, "assistant", resp.reply, intent=resp.intent)
            return resp

    intent, conf = _guess_intent(message)
    if safety.force_intent:
        intent = safety.force_intent

    if intent not in INTENT_LABELS:
        intent = "faq_vaccine"

    entities = _extractor.extract(message)
    store.update_soft_context(session_id, entities)

    context = _normalize_context(req)
    context = _merge_memory_soft_context(context, mem.soft_context)

    if entities.get("age_years") is None and mem.soft_context.get("age_years") is not None:
        entities = dict(entities)
        entities["age_years"] = mem.soft_context["age_years"]
        entities["age_months"] = mem.soft_context.get("age_months")

    has_age = (
        entities.get("age_years") is not None
        or entities.get("age_months") is not None
        or context.get("age_years") is not None
        or context.get("age_months") is not None
    )
    ask_what_vax = bool(
        re.search(
            r"((hiện giờ|bây giờ|lúc này|hiện tại).*(tiêm|vaccine)|"
            r"có thể tiêm|nên tiêm gì|tiêm được.*gì|"
            r"tiêm những (gì|vaccine|mũi)|các vaccine nào)",
            message or "",
            re.I,
        )
    )
    if has_age and ask_what_vax and intent in ("faq_vaccine", "unknown", "chitchat"):
        intent = "schedule_advice"
        conf = max(conf, 0.9)

    if mem.soft_context.get("awaiting_age_confirm") and intent in (
        "chitchat",
        "unknown",
        "faq_vaccine",
    ):
        intent = "schedule_advice"
        conf = max(conf, 0.9)

    try:
        common_kwargs = {
            "message": message,
            "session_id": session_id,
            "conf": conf,
            "context": context,
            "entities": entities,
            "history": history,
        }
        if intent == "chitchat":
            resp = handle_chitchat(message, session_id, conf, history=history)
        elif intent == "out_of_scope":
            resp = handle_out_of_scope(
                message, session_id, conf, reason=safety.reason, history=history
            )
        elif intent == "schedule_advice":
            resp = handle_schedule_advice(**common_kwargs)
        elif intent == "history_lookup":
            resp = handle_history_lookup(**common_kwargs)
        elif intent == "vaxcare_lookup":
            resp = handle_vaxcare_lookup(**common_kwargs)
        elif intent == "faq_vaccine":
            resp = handle_faq_vaccine(**common_kwargs)
        else:
            resp = handle_unknown(message, session_id, conf, history=history)
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

    # Lưu lượt hội thoại
    store.add_turn(session_id, "user", message, intent=intent)
    store.add_turn(session_id, "assistant", resp.reply, intent=resp.intent)

    meta = dict(resp.meta or {})
    meta.setdefault("stage", "logic-llm")
    meta["safety_level"] = safety.level
    meta["memory_turns"] = len(mem.turns)
    meta["memory_soft"] = {
        k: mem.soft_context.get(k)
        for k in (
            "age_years",
            "age_months",
            "vaccine_ids",
            "age_source",
            "age_confirmed",
            "awaiting_age_confirm",
            "subject",
        )
        if mem.soft_context.get(k) is not None
    }
    resp.meta = meta
    resp.session_id = session_id
    return resp
