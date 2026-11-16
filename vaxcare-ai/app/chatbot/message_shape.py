from __future__ import annotations

import re


def has_age_mention(text: str) -> bool:
    t = (text or "").lower()
    return bool(re.search(r"\d+\s*(tuổi|tháng)|sơ sinh", t))


def has_substantive_question(text: str) -> bool:
    """Còn nội dung hỏi ngoài việc nêu tuổi (vaccine, mũi, triệu chứng…)."""
    t = (text or "").strip().lower()
    if not t:
        return False
    if re.search(
        r"(\?|không|gì|sao|thế nào|như thế nào|ra sao|"
        r"chỗ nào|khác gì|khác nhau|bao lâu|mấy|bao nhiêu|"
        r"có sao|thì sao|được không|bắt buộc|cần không)",
        t,
    ):
        # Tránh: chỉ "18 tuổi?" vẫn có ? nhưng không substantive
        if re.match(
            r"^(bé|con|cháu|tôi|mình|em|nhà mình)?\s*"
            r"\d+\s*(tuổi|tháng)\s*[\?\.]?\s*$",
            t,
        ):
            return False
        return True
    if re.search(
        r"(tiêm gì|tiêm những|vaccine|vắc\s*xin|vắc-xin|lịch tiêm|phác đồ|"
        r"mũi\s*\d+|mũi nào|còn mũi|chưa tiêm|tiêm được|"
        r"sốt|phản ứng|sưng|đau|bắt buộc|hàng năm|"
        r"phòng bệnh|khoảng cách|là sao|là gì|khác (mũi|gì|nhau)|"
        r"so với|như thế nào|ra sao)",
        t,
    ):
        return True
    # Tên vaccine / viết tắt đứng trước "mũi" (mọi loại, không whitelist)
    if re.search(r"[a-zà-ỹ0-9]{2,}\s+mũi\s*\d+", t):
        return True
    # Có entity-style: chữ + mũi / tiêm trong cùng câu ngắn kèm tuổi
    if has_age_mention(t) and re.search(r"\b(mũi|tiêm|vaccine|vắc)\b", t):
        # Trừ câu thuần "tiêm cho bé 2 tuổi" kiểu khai báo — vẫn substantive nếu có hỏi
        if re.search(r"(là sao|là gì|khác|gì|\?|không|sao)", t):
            return True
    return False


def is_pure_age_statement(text: str) -> bool:
    """Chỉ khai báo tuổi, không kèm câu hỏi / vaccine / triệu chứng."""
    t = (text or "").strip().lower()
    if not t or not has_age_mention(t):
        return False
    if has_substantive_question(t):
        return False
    # Câu ngắn, chủ yếu tuổi
    if len(t) > 100:
        return False
    return bool(
        re.search(
            r"(bé|con|cháu|trẻ|nhà mình|tôi|mình|em).{0,24}\d+\s*(tuổi|tháng)"
            r"|\d+\s*(tuổi|tháng)",
            t,
        )
    )
