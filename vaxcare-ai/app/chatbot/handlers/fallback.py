from __future__ import annotations

from app.schemas.chat import Action, ChatResponse, Source


def handle_chitchat(message: str, session_id: str, conf: float) -> ChatResponse:
    reply = (
        "Chào bạn! Mình là trợ lý thông tin tiêm chủng VaxCare. "
        "Bạn có thể hỏi về:\n"
        "• Thông tin vaccine / bệnh được phòng\n"
        "• Lộ trình tiêm theo độ tuổi\n"
        "• Đối chiếu lịch sử tiêm trong tài khoản\n"
        "• Tìm vaccine, cơ sở và đặt lịch\n"
        "Bạn muốn bắt đầu từ đâu?"
    )
    return ChatResponse(
        reply=reply,
        intent="chitchat",
        intent_confidence=conf,
        session_id=session_id,
        meta={"handler": "chitchat"},
    )


def handle_out_of_scope(
    message: str,
    session_id: str,
    conf: float,
    reason: str = "",
    emergency: bool = False,
) -> ChatResponse:
    if emergency:
        reply = (
            "Mình nhận thấy nội dung có dấu hiệu cần hỗ trợ y tế kịp thời. "
            "Chatbot không thay thế cấp cứu. "
            "Nếu đang khó thở, đau ngực, sốc phản vệ hoặc tình trạng nặng, "
            "hãy gọi cấp cứu hoặc đến cơ sở y tế gần nhất ngay."
        )
    else:
        reply = (
            "Câu hỏi này nằm ngoài phạm vi chatbot thông tin tiêm chủng "
            "(không chẩn đoán, không kê đơn, không tư vấn điều trị cụ thể). "
            "Với quyết định liên quan sức khỏe, bạn nên trao đổi trực tiếp với nhân viên y tế. "
            "Bạn có thể hỏi lại về vaccine, lịch tiêm theo tuổi, hoặc tra cứu trên VaxCare."
        )
    return ChatResponse(
        reply=reply,
        intent="out_of_scope",
        intent_confidence=conf,
        session_id=session_id,
        safe_mode=True,
        meta={"handler": "out_of_scope", "reason": reason},
    )


def handle_unknown(message: str, session_id: str, conf: float) -> ChatResponse:
    reply = (
        "Mình chưa chắc ý bạn. Bạn có thể hỏi rõ hơn, ví dụ:\n"
        "• «Tôi 20 tuổi nên kiểm tra vaccine nào?»\n"
        "• «Vaccine HPV phòng bệnh gì?»\n"
        "• «Đã tiêm mũi 1 HPV, tiếp theo sao?»"
    )
    return ChatResponse(
        reply=reply,
        intent="faq_vaccine",
        intent_confidence=conf,
        session_id=session_id,
        meta={"handler": "fallback"},
    )
