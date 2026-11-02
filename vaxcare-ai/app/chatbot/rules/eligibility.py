from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

DEFER_KEYWORDS = [
    "sốt",
    "sot",
    "đang ốm",
    "nhiễm trùng cấp",
    "đang bệnh",
    "suy giảm miễn dịch nặng",
    "hóa trị",
    "xạ trị",
    "ghép tạng",
    "dị ứng nặng vaccine",
    "sốc phản vệ vaccine",
    "phản ứng phản vệ",
]

CAUTION_KEYWORDS = [
    "mang thai",
    "thai",
    "đang cho con bú",
    "dị ứng",
    "hen",
    "co giật",
    "động kinh",
    "tiểu đường",
    "tim mạch",
]


@dataclass
class EligibilityResult:
    status: str  
    reasons: list[str] = field(default_factory=list)
    advice: str = ""
    needs_clinician: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def check_eligibility_from_text(text: str) -> EligibilityResult:
    """
    Phân tích câu mô tả triệu chứng / tình trạng của người dùng.
    Không kết luận 'được tiêm' hay 'không được tiêm' — chỉ gợi ý mức độ thận trọng.
    """
    t = (text or "").lower()
    reasons: list[str] = []
    status = "ok_to_discuss"

    for kw in DEFER_KEYWORDS:
        if kw in t:
            reasons.append(f"Phát hiện yếu tố gợi ý tạm hoãn: «{kw}»")
            status = "defer_suggested"

    for kw in CAUTION_KEYWORDS:
        if kw in t:
            reasons.append(f"Yếu tố cần thận trọng / hỏi thêm: «{kw}»")
            if status == "ok_to_discuss":
                status = "caution"

    if status == "defer_suggested":
        advice = (
            "Có dấu hiệu gợi ý nên tạm hoãn hoặc khám sàng lọc kỹ trước khi tiêm. "
            "Chatbot không thể thay thế khám sàng lọc tại cơ sở. "
            "Bạn nên đến cơ sở tiêm chủng / bác sĩ để được đánh giá trực tiếp."
        )
        needs = True
    elif status == "caution":
        advice = (
            "Có yếu tố cần trao đổi thêm với nhân viên y tế trước khi tiêm. "
            "Thông tin dưới đây chỉ mang tính tham khảo theo hướng dẫn sàng lọc chung."
        )
        needs = True
    else:
        advice = (
            "Không phát hiện từ khóa chống chỉ định / tạm hoãn rõ trong câu hỏi. "
            "Vẫn cần khám sàng lọc tại chỗ theo quy định trước khi tiêm."
        )
        needs = False

    if not t.strip():
        status = "unknown"
        advice = "Chưa có thông tin tình trạng sức khỏe để đánh giá sơ bộ."
        needs = False

    return EligibilityResult(
        status=status,
        reasons=reasons,
        advice=advice,
        needs_clinician=needs,
    )


def format_eligibility_text(result: EligibilityResult) -> str:
    lines = [result.advice]
    if result.reasons:
        lines.append("Chi tiết:")
        for r in result.reasons:
            lines.append(f"- {r}")
    lines.append(
        "Nguồn tham khảo định hướng: Quyết định 1575/QĐ-BYT (hướng dẫn khám sàng lọc trước tiêm) "
        "và tờ hướng dẫn sử dụng của từng sản phẩm."
    )
    return "\n".join(lines)
