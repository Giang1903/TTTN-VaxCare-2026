from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal


SafetyLevel = Literal["ok", "emergency", "diagnosis", "out_of_scope", "sensitive"]


EMERGENCY_PATTERNS = [
    r"khó thở",
    r"khó\s*thở",
    r"ngạt thở",
    r"đau ngực",
    r"đau\s*ngực",
    r"co giật",
    r"bất tỉnh",
    r"mê man",
    r"sốc phản vệ",
    r"phù mặt.*sau tiêm",
    r"cấp cứu",
    r"cấp\s*cứu",
    r"tím tái",
    r"chảy máu không cầm",
]

DIAGNOSIS_PATTERNS = [
    r"chẩn đoán",
    r"tôi bị bệnh gì",
    r"có phải.*ung thư",
    r"kê đơn",
    r"uống thuốc gì",
    r"liều lượng.*mg",
    r"điều trị.*như thế nào",
]

OUT_OF_SCOPE_PATTERNS = [
    r"giá cổ phiếu",
    r"bóng đá",
    r"thời tiết",
    r"nấu ăn",
    r"học lập trình",
]


@dataclass
class SafetyVerdict:
    level: SafetyLevel
    reason: str = ""
    force_intent: str | None = None  


def check_safety(text: str) -> SafetyVerdict:
    t = (text or "").lower().strip()
    if not t:
        return SafetyVerdict(level="ok")

    for p in EMERGENCY_PATTERNS:
        if re.search(p, t, re.I):
            return SafetyVerdict(
                level="emergency",
                reason=f"Khớp mẫu cấp cứu: {p}",
                force_intent="out_of_scope",
            )

    for p in DIAGNOSIS_PATTERNS:
        if re.search(p, t, re.I):
            return SafetyVerdict(
                level="diagnosis",
                reason=f"Yêu cầu chẩn đoán/điều trị: {p}",
                force_intent="out_of_scope",
            )

    for p in OUT_OF_SCOPE_PATTERNS:
        if re.search(p, t, re.I):
            return SafetyVerdict(
                level="out_of_scope",
                reason=f"Ngoài phạm vi: {p}",
                force_intent="out_of_scope",
            )

    return SafetyVerdict(level="ok")
