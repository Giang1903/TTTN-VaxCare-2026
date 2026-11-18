from __future__ import annotations

import re
from typing import Literal

FaqSubtype = Literal[
    "confirm",
    "indication",
    "never_vaccinated",
    "regimen",
    "interval",
    "mandatory",
    "post_vax",        # sốt / phản ứng sau tiêm
    "disease",
    "definition",
    "next_dose",
    "general",
]


def classify_faq_subtype(message: str) -> FaqSubtype:
    t = (message or "").strip().lower()
    if not t:
        return "general"

    # 1) Confirm ý vừa nói — hẹp, tránh "tiêm được không"
    if re.search(
        r"(tiêm được không|có tiêm được|nên tiêm không|chưa tiêm|"
        r"chưa từng|người trẻ|người già|có cần|ai nên|đối tượng)",
        t,
    ):
        pass  # không confirm
    elif re.search(
        r"(phải không|đúng không|có phải không|phải vậy không|"
        r"đúng vậy không|đúng chứ|đúng nhỉ|đúng hả|phải hả|"
        r"vậy hả|thế hả|vậy à|thế à|"
        r"\bý là\b|\btức là\b|\bnghĩa là\b|^(vậy là|thế là)\b)",
        t,
    ):
        return "confirm"

    # 2) Phản ứng sau tiêm (sốt, sưng, mệt…)
    if re.search(
        r"(sau tiêm|tiêm xong|sau khi tiêm).*(sốt|nóng|sưng|đau|mẩn|ngứa|mệt|ói|nôn|khó thở)|"
        r"(sốt|sưng|đau tại chỗ|phản ứng).*(sau tiêm|tiêm xong)|"
        r"(tiêm xong|sau tiêm).*(thì sao|có sao|làm gì|xử trí|phải làm)|"
        r"phản ứng sau tiêm|tác dụng phụ sau tiêm|tai biến sau tiêm",
        t,
    ):
        return "post_vax"

    # 3) Bắt buộc / tiêm hàng năm
    if re.search(
        r"(bắt buộc|có bắt buộc|có phải tiêm|năm nào cũng|"
        r"hàng năm|mỗi năm|thường niên|có cần tiêm.*năm|"
        r"tiêm lại.*năm|hàng năm có)",
        t,
    ):
        return "mandatory"

    # 3) Chưa tiêm bao giờ
    if re.search(r"chưa tiêm( bao giờ| lần nào)?|chưa từng tiêm|chưa tiêm lần nào", t):
        return "never_vaccinated"

    # 3) Chỉ định / có cần / tiêm được không / trẻ vs già
    if re.search(
        r"(tiêm được không|có tiêm được|nên tiêm không|có nên tiêm|"
        r"có cần (tiêm|không)|cần tiêm không|"
        r"người trẻ|người già|chỉ (người già|người lớn tuổi)|"
        r"ai (nên|phải) tiêm|đối tượng tiêm|"
        r"bao nhiêu tuổi trở lên|từ mấy tuổi|mấy tuổi tiêm)",
        t,
    ):
        return "indication"

    # 4) Khoảng cách / chờ bao lâu
    if re.search(
        r"(khoảng cách|cách nhau|chờ bao lâu|bao lâu.*mũi|"
        r"mũi (2|hai|tiếp).*bao lâu|sau mũi.*bao lâu|"
        r"interval|cách mũi)",
        t,
    ):
        return "interval"

    # 5) Đã tiêm mũi N → mũi tiếp
    if re.search(r"(đã tiêm|tiêm xong).*(mũi|liều)\s*\d+|(mũi|liều)\s*\d+\s*(rồi|xong)", t):
        return "next_dose"

    # 6) Phác đồ / số liều / mũi N là gì
    if re.search(
        r"(phác đồ|bao nhiêu (mũi|liều)|mấy (mũi|liều)|"
        r"\d+\s*liều|\d+\s*mũi|hai liều|ba liều|"
        r"mũi\s*\d+.*(là sao|là gì|khác|khác gì|khác nhau)|"
        r"(là sao|khác nhau|khác gì).*mũi|"
        r"người nào.*(2|3)\s*(liều|mũi)|(2|3)\s*(liều|mũi).*người nào)",
        t,
    ):
        return "regimen"

    # 7) Bệnh học
    if re.search(
        r"(nguyên nhân|đường lây|lây qua|triệu chứng|vì sao (mắc|bị))",
        t,
    ):
        return "disease"

    # 8) Định nghĩa / phòng gì
    if re.search(
        r"(phòng (bệnh )?gì|phòng những gì|là gì|tác dụng|"
        r"công dụng|dùng để|hiệu quả)",
        t,
    ):
        return "definition"

    return "general"


def needs_age_slot(subtype: FaqSubtype, message: str) -> bool:
    """Hỏi tuổi khi câu mang tính cá nhân; câu hỏi chung (người trẻ/già) thì không."""
    t = message or ""
    if re.search(r"\d+\s*(tuổi|tháng)", t):
        return False
    # Hỏi chung về nhóm tuổi dân số → trả lời nguyên tắc, không hỏi tuổi user
    if re.search(
        r"(người trẻ|người già|người lớn tuổi|trẻ em|người cao tuổi|"
        r"ai nên|đối tượng|nhóm nào)",
        t.lower(),
    ):
        return False
    if subtype in ("indication", "never_vaccinated"):
        # Cá nhân: tiêm được không / mình chưa tiêm
        if re.search(
            r"(tôi|mình|em|cháu|bé nhà|tiêm được không|chưa tiêm)",
            t.lower(),
        ):
            return True
    return False
