from __future__ import annotations

SYSTEM_PROMPT = """Bạn là trợ lý thông tin tiêm chủng của VaxCare tại Việt Nam.
Nhiệm vụ: trả lời ngắn gọn, rõ ràng, bằng tiếng Việt, dựa trên ngữ cảnh được cung cấp.
Quy tắc bắt buộc:
1. Chỉ dùng thông tin trong ngữ cảnh / kết quả rule engine. Không bịa số liệu, lịch tiêm, hoặc nguồn.
2. Nếu ngữ cảnh không đủ, nói rõ "chưa đủ căn cứ trong tài liệu hiện có" và khuyên hỏi nhân viên y tế.
3. Không chẩn đoán bệnh, không kê đơn, không hướng dẫn xử trí cấp cứu.
4. Luôn nhắc nội dung mang tính tham khảo, không thay thế tư vấn y tế trực tiếp.
5. Khi có nguồn (Thông tư, QĐ BYT, WHO, HDSD), nêu tên nguồn ở cuối.
6. Trả lời tối đa 180–220 từ, ưu tiên gạch đầu dòng khi liệt kê mũi tiêm.
"""

INTENT_TEMPLATES = {
    "faq_vaccine": """Người dùng hỏi thông tin vaccine / bệnh phòng ngừa.
Ngữ cảnh truy xuất:
{context}

Câu hỏi: {question}

Hãy giải thích: công dụng, đối tượng, lịch tham khảo (nếu có trong ngữ cảnh), lưu ý thường gặp.
Kết thúc bằng nguồn nếu có.""",
    "schedule_advice": """Người dùng hỏi lộ trình / mốc tiêm theo tuổi.
Kết quả rule engine:
{rule_result}

Ngữ cảnh bổ sung (nếu có):
{context}

Câu hỏi: {question}

Viết câu trả lời tự nhiên dựa trên rule_result, không thêm mũi không có trong kết quả.""",
    "history_lookup": """Người dùng hỏi về lịch sử tiêm / mũi tiếp theo.
Kết quả đối chiếu hồ sơ:
{rule_result}

Câu hỏi: {question}

Giải thích những gì đã ghi nhận và mốc nên kiểm tra tiếp. Nếu thiếu hồ sơ, hướng dẫn cung cấp thêm.""",
    "vaxcare_lookup": """Người dùng muốn tìm vaccine, cơ sở hoặc đặt lịch trên VaxCare.
Thực thể nhận diện: {entities}
Câu hỏi: {question}

Trả lời ngắn, hướng người dùng tới chức năng tra cứu / đặt lịch trên hệ thống.""",
    "chitchat": """Người dùng chào hỏi / cảm ơn.
Câu hỏi: {question}
Trả lời thân thiện, giới thiệu 3–4 khả năng hỗ trợ chính của chatbot tiêm chủng.""",
    "out_of_scope": """Câu hỏi ngoài phạm vi hoặc cần hỗ trợ y tế trực tiếp.
Câu hỏi: {question}
Lịch sự từ chối, giải thích giới hạn chatbot, khuyến cáo đến cơ sở y tế nếu cần.""",
}


def build_messages(
    intent: str,
    question: str,
    context: str = "",
    rule_result: str = "",
    entities: str = "",
) -> list[dict[str, str]]:
    template = INTENT_TEMPLATES.get(intent, INTENT_TEMPLATES["faq_vaccine"])
    user_content = template.format(
        question=question,
        context=context or "(không có)",
        rule_result=rule_result or "(không có)",
        entities=entities or "(không có)",
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
