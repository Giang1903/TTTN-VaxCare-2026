from __future__ import annotations

import logging
import re
import uuid
from pathlib import Path

from app.chatbot.intent.labels import INTENT_LABELS
from app.schemas.chat import Action, ChatRequest, ChatResponse, Source

logger = logging.getLogger(__name__)

_clf = None
_CLF_PATH = Path(__file__).resolve().parents[2] / "models" / "intent_clf.joblib"


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
    if re.search(r"\b(chào|hello|hi|cảm ơn|thanks)\b", t):
        return "chitchat", 0.9
    if re.search(r"(lịch sử|đã tiêm|mũi \d|hồ sơ tiêm)", t):
        return "history_lookup", 0.75
    if re.search(r"(đặt lịch|cơ sở|phòng khám|ở đâu|đăng ký tiêm)", t):
        return "vaxcare_lookup", 0.75
    if re.search(r"(\d+\s*tuổi|bao nhiêu tuổi|lộ trình|mốc tiêm|tiêm gì)", t):
        return "schedule_advice", 0.7
    if re.search(r"(đau ngực|khó thở|cấp cứu|chẩn đoán|uống thuốc gì)", t):
        return "out_of_scope", 0.85
    if re.search(r"(vaccine|vắc xin|phòng bệnh|tác dụng|chống chỉ định)", t):
        return "faq_vaccine", 0.7
    return "faq_vaccine", 0.4


def _guess_intent(text: str) -> tuple[str, float]:
    clf = _get_classifier()
    if clf is not None:
        label, conf = clf.predict(text)
        if not clf.is_confident(conf):
            # thấp confidence → fallback regex
            reg_label, reg_conf = _guess_intent_regex(text)
            if reg_conf >= conf:
                return reg_label, reg_conf
        return label, conf
    return _guess_intent_regex(text)


def handle_chat(req: ChatRequest) -> ChatResponse:
    intent, conf = _guess_intent(req.message)
    session_id = req.session_id or str(uuid.uuid4())
    sources: list[Source] = []
    actions: list[Action] = []
    safe_mode = False

    if intent == "chitchat":
        reply = (
            "Chào bạn! Mình có thể hỗ trợ thông tin về vaccine, "
            "gợi ý mốc tiêm theo độ tuổi, xem lại lịch sử tiêm trong tài khoản "
            "hoặc hướng dẫn đặt lịch tại VaxCare. Bạn đang quan tâm điều gì?"
        )
    elif intent == "out_of_scope":
        safe_mode = True
        reply = (
            "Mình chưa thể tư vấn tình huống này vì nằm ngoài phạm vi chatbot thông tin. "
            "Nếu bạn đang khó chịu nhiều hoặc nghi cấp cứu, hãy đến cơ sở y tế gần nhất. "
            "Với quyết định điều trị cụ thể, nên trao đổi trực tiếp với nhân viên y tế nhé."
        )
    elif intent == "history_lookup":
        reply = (
            "Để đối chiếu lịch sử tiêm, mình cần hồ sơ trong tài khoản đăng nhập của bạn. "
            "Bạn có thể mở mục lịch sử tiêm để xem các mũi đã ghi nhận, "
            "hoặc cho mình biết bạn đã tiêm vaccine nào / mũi thứ mấy để mình gợi ý bước tiếp theo."
        )
        actions.append(
            Action(type="OPEN_HISTORY", label="Xem lịch sử tiêm", path="/history")
        )
    elif intent == "vaxcare_lookup":
        reply = (
            "Bạn muốn tìm vaccine, cơ sở tiêm hay đặt lịch luôn? "
            "Cho mình thêm chút thông tin (tên vaccine hoặc khu vực) "
            "để mình chỉ đúng chỗ trên VaxCare nhé."
        )
        actions.append(
            Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
        )
    elif intent == "schedule_advice":
        reply = (
            "Mình hiểu bạn đang muốn biết nên quan tâm những mũi tiêm nào theo độ tuổi. "
            "Hiện tại mình có thể định hướng theo khuyến cáo tiêm chủng "
            "(ví dụ khung của Bộ Y tế / TCMR); khi kho tài liệu được nạp đủ, "
            "câu trả lời sẽ kèm nguồn cụ thể hơn. "
            "Bạn cho mình biết chính xác bao nhiêu tuổi (hoặc năm sinh) "
            "và đã tiêm những gì nhé?"
        )
        sources.append(
            Source(
                doc_id="tt10-2024",
                title="Thông tư 10/2024/TT-BYT",
                issuer="Bộ Y tế",
                tier="A",
            )
        )
    else:
        reply = (
            "Bạn đang hỏi về thông tin vaccine phải không? "
            "Hãy nêu tên vaccine hoặc bệnh muốn phòng (ví dụ HPV, viêm gan B, cúm) "
            "để mình giải thích rõ hơn. "
            "Lưu ý: nội dung chỉ mang tính tham khảo, "
            "không thay cho tư vấn trực tiếp của bác sĩ."
        )

    if intent not in INTENT_LABELS:
        intent = "faq_vaccine"

    return ChatResponse(
        reply=reply,
        intent=intent,
        intent_confidence=conf,
        sources=sources,
        actions=actions,
        session_id=session_id,
        safe_mode=safe_mode,
        meta={"stage": "intent-clf", "ai1_ai2": "unchanged"},
    )
