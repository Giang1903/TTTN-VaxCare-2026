from __future__ import annotations

SYSTEM_PROMPT = """Bạn là trợ lý tiêm chủng VaxCare.

BẮT BUỘC:
1. Chỉ dùng sự kiện có trong phần ngữ cảnh / kết quả rule. Không bịa thuốc, phẫu thuật, kháng sinh, liều, hay bệnh không có trong ngữ cảnh.
2. Trả lời đúng câu hỏi. Hỏi "là gì" / "là bệnh gì" → chỉ định nghĩa ngắn (1–3 câu), không kể phác đồ trừ khi được hỏi.
3. Hỏi số mũi / phác đồ / lịch → chỉ nêu lịch có trong ngữ cảnh hoặc rule.
4. Không viết lại hướng dẫn nội bộ, không viết "Phân loại câu hỏi", không hỏi lại user bằng menu lựa chọn.
5. Thiếu thông tin → nói chưa có trong tài liệu, không suy diễn.
6. Tiếng Việt, ngắn gọn. Liệt kê: mỗi ý một dòng bắt đầu bằng •
7. Có thể nêu nguồn ngắn ở cuối nếu ngữ cảnh có tên tài liệu.
"""

INTENT_TEMPLATES = {
    "faq_vaccine": """Ngữ cảnh truy xuất (chỉ được dùng các ý dưới đây):
{context}

Kết quả sàng lọc sơ bộ (nếu có):
{rule_result}

Câu hỏi của người dùng: {question}

Viết câu trả lời tiếng Việt, đúng trọng tâm câu hỏi, bám sát ngữ cảnh. Không thêm ý ngoài ngữ cảnh.""",
    "schedule_advice": """Kết quả rule / sàng lọc:
{rule_result}

Ngữ cảnh thêm:
{context}

Câu hỏi: {question}

Chỉ dựa trên kết quả rule ở trên. Không thêm mũi không có trong kết quả.""",
    "history_lookup": """Kết quả đối chiếu hồ sơ:
{rule_result}

Câu hỏi: {question}

Nói rõ đã ghi nhận gì và bước tiếp theo. Thiếu hồ sơ thì bảo user cung cấp tuổi / số mũi đã tiêm.""",
    "vaxcare_lookup": """Thực thể: {entities}
Câu hỏi: {question}
Trả lời ngắn, hướng sang chức năng trên VaxCare. Không bịa tồn kho.""",
    "chitchat": """Câu hỏi: {question}
Chào ngắn, gợi ý 1–2 việc chatbot giúp được.""",
    "out_of_scope": """Câu hỏi: {question}
Từ chối lịch sự, không chẩn đoán.""",
}


def build_messages(
    intent: str,
    question: str,
    context: str = "",
    rule_result: str = "",
    entities: str = "",
) -> list[dict[str, str]]:
    template = INTENT_TEMPLATES.get(intent) or INTENT_TEMPLATES["faq_vaccine"]
    user_content = template.format(
        question=question or "",
        context=context or "(không có)",
        rule_result=rule_result or "(không có)",
        entities=entities or "(không có)",
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
