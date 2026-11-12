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

        # Sprint 1: load với threshold mới từ settings
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

    # --- Safety / out of scope (ưu tiên tuyệt đối) ---
    if re.search(
        r"(đau ngực|khó thở|cấp cứu|co giật|sốc phản vệ|bất tỉnh|tím tái|"
        r"chẩn đoán|tôi bị bệnh gì|uống thuốc gì|kê đơn|cho tôi đơn|"
        r"thời tiết|bóng đá|chứng khoán|bitcoin|crypto|giá vàng|"
        r"cho chó|cho mèo|thú cưng|nấu ăn|học lập trình)",
        t,
    ):
        return "out_of_scope", 0.93

    # --- Chitchat ---
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

    # --- VaxCare product / facility / booking ---
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

    # --- History / personal record (hồ sơ cá nhân, đã tiêm cụ thể) ---
    # Tránh bắt câu "tiêm những mũi nào theo tuổi" (đó là schedule_advice)
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

    # --- Disease etiology / symptoms → FAQ ---
    if re.search(
        r"(nguyên\s*nhân|lý\s*do\s*(mắc|bệnh)|đường\s*lây|triệu\s*chứng|"
        r"vì\s*sao\s*(mắc|bị|nhiễm)|biểu hiện|lây truyền)",
        t,
    ):
        return "faq_vaccine", 0.90

    # --- Explicit FAQ about vaccine properties ---
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

    # --- Phác đồ / số liều (FAQ kiến thức, KHÔNG phải lịch theo tuổi) ---
    if re.search(
        r"((phác đồ|bao nhiêu liều|mấy liều|\d+\s*liều|"
        r"2\s*liều|3\s*liều|hai liều|ba liều|"
        r"tiêm (mấy|bao nhiêu) (mũi|liều)|"
        r"ai (nên|phải) tiêm|người nào (nên|phải) tiêm|"
        r"đối tượng tiêm|chỉ định tiêm).*)",
        t,
    ) and not re.search(
        r"(\d+\s*tuổi|\d+\s*tháng|theo tuổi|theo tcmr|lịch tiêm của)",
        t,
    ):
        return "faq_vaccine", 0.93

    # --- Schedule / age-based advice ---
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

    # --- "Hiện tiêm được gì / nên tiêm gì" → schedule (ưu tiên cao hơn FAQ chung) ---
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

    # --- Generic vaccine mention → FAQ with medium conf ---
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

    # Regex rất chắc → tin regex
    if reg_conf >= 0.88:
        return reg_label, reg_conf

    clf = _get_classifier()
    if clf is not None:
        label, conf = clf.predict(text)

        # Tránh classifier ép chitchat khi regex đã nhận ra intent khác
        if label == "chitchat" and reg_label != "chitchat" and reg_conf >= 0.65:
            return reg_label, max(reg_conf, 0.78)

        # Classifier không đủ tự tin → ưu tiên regex nếu regex tốt hơn
        if not clf.is_confident(conf):
            if reg_conf >= conf:
                return reg_label, reg_conf
            # cả hai đều thấp → vẫn trả classifier nhưng conf thấp
            return label, conf

        # Classifier tự tin nhưng regex cũng khá mạnh và khác label
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



def _is_follow_up_message(message: str) -> bool:
    """Câu ngắn / đại từ / nối tiếp chủ đề trước — chưa chắc là intent mới độc lập."""
    t = (message or "").strip()
    if not t:
        return False
    tl = t.lower()
    # Rõ ràng chủ đề mới → không coi follow-up cưỡng bức
    if re.search(
        r"(\d+\s*tuổi|\d+\s*tháng|sơ sinh|"
        r"đặt lịch|tìm cơ sở|hồ sơ tiêm|lịch sử tiêm|"
        r"chào|hello|hi\b|bạn là ai)",
        tl,
    ):
        return False
    if len(t) <= 80 and re.search(
        r"(còn |thế |vậy |thế còn|còn về|còn (gì|ai|khi|bao)|"
        r"còn không|thế nào|như thế nào|ra sao|"
        r"còn (liều|mũi|phác đồ)|"
        r"\b(nó|cái đó|loại đó|vaccine đó|mũi đó|thuốc đó)\b|"
        r"^(còn|thế|vậy|còn về)\b|"
        r"(ai|người nào|đối tượng).*(tiêm|dùng|nên)|"
        r"(bao nhiêu|mấy)\s*(liều|mũi)|"
        r"(\d+|hai|ba)\s*liều|"
        r"phác đồ|chỉ định|chống chỉ định|"
        r"tác dụng phụ|phản ứng|sau tiêm|"
        r"khi nào (tiêm|nên)|tiêm lúc nào|"
        r"có (cần|phải|nên) không|được không)",
        tl,
    ):
        return True
    # Câu rất ngắn không nêu vaccine/tuổi cụ thể
    if len(t) <= 40 and not re.search(
        r"(bcg|hpv|mmr|sởi|cúm|zona|shingrix|viêm gan|uốn ván|"
        r"dtp|hib|ipv|je|rota|pcv|thủy đậu|covid)",
        tl,
    ):
        if re.search(r"(liều|mũi|tiêm|phòng|bệnh|ai |khi nào|bao nhiêu)", tl):
            return True
    return False


def _apply_conversation_continuity(
    message: str,
    intent: str,
    conf: float,
    mem,
    entities: dict,
) -> tuple[str, float, dict]:
    """
    Giữ chủ đề/intent lượt trước khi user hỏi nối tiếp.
    Tránh: đang hỏi HPV → câu sau bị kéo sang lịch theo tuổi hồ sơ.
    """
    last_intent = mem.soft_context.get("last_intent")
    last_vax = list(mem.soft_context.get("last_vaccines") or [])
    last_vids = list(mem.soft_context.get("vaccine_ids") or [])
    follow = _is_follow_up_message(message)

    entities = dict(entities or {})

    # Gắn vaccine lượt trước nếu câu hiện tại không nêu tên mới
    has_new_vax = bool(entities.get("vaccines") or entities.get("vaccine_ids"))
    if last_vax and not has_new_vax and (
        follow or intent in ("faq_vaccine", "unknown", "chitchat")
    ):
        entities["vaccines"] = last_vax[:3]
        if last_vids and not entities.get("vaccine_ids"):
            entities["vaccine_ids"] = last_vids[:3]

    if not follow or not last_intent:
        return intent, conf, entities

    # Follow-up sau FAQ → giữ FAQ (kiến thức / phác đồ / đối tượng)
    if last_intent == "faq_vaccine" and intent in (
        "schedule_advice",
        "chitchat",
        "unknown",
        "faq_vaccine",
    ):
        # Chỉ chuyển schedule nếu user rõ ràng hỏi lịch cá nhân theo tuổi
        personal_schedule = bool(
            re.search(
                r"((hiện giờ|bây giờ|lúc này).*(tiêm|vaccine)|"
                r"tôi (nên|có thể) tiêm|"
                r"bé (nên|cần) tiêm|"
                r"theo (tuổi|hồ sơ)|lịch của (tôi|bé|mình)|"
                r"\d+\s*(tuổi|tháng).*(tiêm|vaccine|lịch))",
                message or "",
                re.I,
            )
        )
        if not personal_schedule:
            return "faq_vaccine", max(conf, 0.88), entities

    # Follow-up sau schedule → giữ schedule nếu vẫn nói mũi/lịch
    if last_intent == "schedule_advice" and intent in ("chitchat", "unknown", "faq_vaccine"):
        if re.search(r"(mũi|lịch|tiêm|tuổi|tháng|còn|tiếp)", message or "", re.I):
            return "schedule_advice", max(conf, 0.85), entities

    # Follow-up sau history
    if last_intent == "history_lookup" and intent in ("chitchat", "unknown"):
        if re.search(r"(mũi|đã tiêm|hồ sơ|lịch sử|sắp)", message or "", re.I):
            return "history_lookup", max(conf, 0.85), entities

    return intent, conf, entities



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
    # Cập nhật soft context (tuổi, vaccine) để lượt sau dùng
    store.update_soft_context(session_id, entities)

    context = _normalize_context(req)
    context = _merge_memory_soft_context(context, mem.soft_context)

    # Nếu entity không bắt được tuổi nhưng memory có → bổ sung vào entities
    if entities.get("age_years") is None and mem.soft_context.get("age_years") is not None:
        entities = dict(entities)
        entities["age_years"] = mem.soft_context["age_years"]
        entities["age_months"] = mem.soft_context.get("age_months")

    # Có tuổi (message / context / memory) + hỏi "tiêm được gì" → ép schedule_advice
    # Tránh rơi FAQ/RAG với chunk không liên quan.
    has_age = (
        entities.get("age_years") is not None
        or entities.get("age_months") is not None
        or context.get("age_years") is not None
        or context.get("age_months") is not None
    )
    ask_what_vax = bool(
        re.search(
            r"((hiện giờ|bây giờ|lúc này|hiện tại).*(tiêm|vaccine|vắc)|"
            r"có thể tiêm (các )?(vaccine|mũi|vắc)|"
            r"nên tiêm (gì|những gì|vaccine gì|mũi gì)(\s|$|\?)|"
            r"tiêm được (các )?(vaccine|mũi) gì|"
            r"tiêm những (vaccine|mũi) nào|"
            r"các vaccine (nào )?(nên|có thể) tiêm)",
            message or "",
            re.I,
        )
    )
    is_regimen_faq = bool(
        re.search(
            r"(phác đồ|\d+\s*liều|2\s*liều|3\s*liều|bao nhiêu liều|mấy liều|"
            r"ai (nên|phải) tiêm|người nào (nên|phải) tiêm|đối tượng tiêm)",
            message or "",
            re.I,
        )
    )

    # Continuity: follow-up bám intent + vaccine lượt trước
    intent, conf, entities = _apply_conversation_continuity(
        message, intent, conf, mem, entities
    )

    if (
        has_age
        and ask_what_vax
        and not is_regimen_faq
        and intent in ("faq_vaccine", "unknown", "chitchat")
    ):
        intent = "schedule_advice"
        conf = max(conf, 0.9)

    # Đang chờ user xác nhận tuổi hồ sơ → giữ schedule (kể cả "ok"/"đúng")
    if mem.soft_context.get("awaiting_age_confirm") and intent in (
        "chitchat",
        "unknown",
        "faq_vaccine",
    ):
        intent = "schedule_advice"
        conf = max(conf, 0.9)

    # Bot đã hỏi tuổi để tư vấn lịch → câu trả lời tuổi/tiếp theo vẫn vào schedule
    if mem.soft_context.get("awaiting_age_for_advice") and intent in (
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

    # Lưu lượt hội thoại + intent/chủ đề để follow-up
    store.add_turn(session_id, "user", message, intent=intent)
    store.add_turn(session_id, "assistant", resp.reply, intent=resp.intent)
    mem.set_soft(last_intent=resp.intent or intent)
    # Nếu FAQ vừa nói vaccine cụ thể trong entities, đã merge; bổ sung từ meta nếu có
    if resp.intent == "faq_vaccine" and entities.get("vaccines"):
        mem.set_soft(last_vaccines=entities.get("vaccines")[:5])

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