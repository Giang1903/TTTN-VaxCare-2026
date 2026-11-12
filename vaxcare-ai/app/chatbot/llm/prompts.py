from __future__ import annotations

SYSTEM_PROMPT = """Bạn là trợ lý tiêm chủng VaxCare.

BẮT BUỘC:
1. Chỉ dùng sự kiện có trong phần ngữ cảnh / kết quả rule / lịch sử hội thoại ngắn. Không bịa thuốc, phẫu thuật, kháng sinh, liều, hay bệnh không có trong ngữ cảnh.
2. Trả lời đúng câu hỏi hiện tại. Nếu user nhắc lại thông tin trước (tuổi, vaccine đã nêu), hãy tận dụng.
3. Hỏi "là gì" / "là bệnh gì" → chỉ định nghĩa ngắn (1–3 câu), không kể phác đồ trừ khi được hỏi.
4. Hỏi số mũi / phác đồ / lịch → chỉ nêu lịch có trong ngữ cảnh hoặc rule.
5. Không viết lại hướng dẫn nội bộ, không viết "Phân loại câu hỏi", không hỏi lại user bằng menu lựa chọn dài.
6. Thiếu thông tin → nói chưa có trong tài liệu, không suy diễn.
7. Tiếng Việt, ngắn gọn. Liệt kê: mỗi ý một dòng bắt đầu bằng •
8. Có thể nêu nguồn ngắn ở cuối nếu ngữ cảnh có tên tài liệu.
9. Không nhắc lại toàn bộ lịch sử hội thoại trong câu trả lời trừ khi cần thiết để làm rõ.
"""

INTENT_TEMPLATES = {
    "faq_vaccine": """Ngữ cảnh truy xuất (chỉ được dùng các ý dưới đây):
{context}

Kết quả sàng lọc sơ bộ (nếu có):
{rule_result}

{history_block}Câu hỏi hiện tại của người dùng: {question}

Viết câu trả lời tiếng Việt, đúng trọng tâm câu hỏi, bám sát ngữ cảnh. Không thêm ý ngoài ngữ cảnh.""",
    "schedule_advice": """Kết quả rule / sàng lọc (NGUỒN DUY NHẤT – phải giữ đúng thứ tự và phân loại):
{rule_result}

Ngữ cảnh thêm:
{context}

{history_block}Câu hỏi hiện tại: {question}

YÊU CẦU BẮT BUỘC:
1. Chỉ được dùng các mũi có trong kết quả rule ở trên. Không thêm vaccine khác.
2. Giữ thứ tự: mốc đúng tuổi / quá hạn trước; dòng "tiêm bù" / "chỉ khi chưa tiêm đủ" để SAU CÙNG hoặc bỏ nếu đã đủ mốc chính.
3. Không đưa Viêm gan B mũi 1 hoặc Uốn ván mũi 1 lên đầu trừ khi rule ghi đó là mốc chính (không phải tiêm bù).
4. Diễn đạt tiếng Việt tự nhiên, ngắn; mỗi mũi một dòng bắt đầu bằng •
5. Giữ nguồn (tt10-2024 / tt52-2025) và một câu lưu ý tham khảo ở cuối.
6. Không bịa lịch hẹn, cơ sở, hoặc số mũi không có trong rule.""",
    "history_lookup": """Kết quả đối chiếu hồ sơ:
{rule_result}

{history_block}Câu hỏi hiện tại: {question}

Nói rõ đã ghi nhận gì và bước tiếp theo. Thiếu hồ sơ thì bảo user cung cấp tuổi / số mũi đã tiêm.""",
    "vaxcare_lookup": """Thực thể: {entities}
{history_block}Câu hỏi hiện tại: {question}
Trả lời ngắn, hướng sang chức năng trên VaxCare. Không bịa tồn kho.""",
    "chitchat": """{history_block}Câu hỏi: {question}
Chào ngắn, gợi ý 1–2 việc chatbot giúp được.""",
    "out_of_scope": """Câu hỏi: {question}
Từ chối lịch sự, không chẩn đoán.""",
}


def _format_history_block(history: list[dict[str, str]] | None) -> str:
    if not history:
        return ""
    lines: list[str] = []
    for m in history[-12:]:  # safety cap
        role = m.get("role", "user")
        content = (m.get("content") or "").strip()
        if not content:
            continue
        label = "Người dùng" if role == "user" else "Trợ lý"
        if len(content) > 320:
            content = content[:300] + "…"
        lines.append(f"{label}: {content}")
    if not lines:
        return ""
    return "Lịch sử hội thoại gần đây:\n" + "\n".join(lines) + "\n\n"


def build_messages(
    intent: str,
    question: str,
    context: str = "",
    rule_result: str = "",
    entities: str = "",
    history: list[dict[str, str]] | None = None,
) -> list[dict[str, str]]:
    """Ghép prompt; dùng replace thay vì str.format để chunk RAG có { } không làm crash."""
    template = INTENT_TEMPLATES.get(intent) or INTENT_TEMPLATES["faq_vaccine"]
    history_block = _format_history_block(history)
    user_content = (
        template
        .replace("{question}", question or "")
        .replace("{context}", context or "(không có)")
        .replace("{rule_result}", rule_result or "(không có)")
        .replace("{entities}", entities or "(không có)")
        .replace("{history_block}", history_block or "")
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]