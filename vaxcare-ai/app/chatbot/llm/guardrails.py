from __future__ import annotations

import re
from dataclasses import dataclass


SUSPICIOUS_NUMBER_PATTERNS = [
    r"\b\d+\s*mg\b",
    r"\b\d+\s*ml\b",
]


@dataclass
class GuardResult:
    ok: bool
    text: str
    warnings: list[str]


def enforce_guardrails(
    text: str,
    require_source_hint: bool = False,
    known_sources: list[str] | None = None,
) -> GuardResult:
    warnings: list[str] = []
    out = (text or "").strip()

    if not out:
        return GuardResult(
            ok=False,
            text=(
                "Xin lỗi, hiện chưa tạo được câu trả lời phù hợp. "
                "Bạn có thể hỏi lại rõ hơn hoặc liên hệ cơ sở tiêm chủng."
            ),
            warnings=["empty_output"],
        )

    for p in SUSPICIOUS_NUMBER_PATTERNS:
        if re.search(p, out, re.I):
            warnings.append(f"suspicious_number:{p}")

    if require_source_hint and known_sources:
        has = any(s.lower() in out.lower() for s in known_sources if s)
        if not has and not re.search(r"(thông tư|quyết định|who|cdc|hdsd|nguồn)", out, re.I):
            out = out.rstrip() + (
                "\n\nNguồn tham khảo định hướng: "
                + ", ".join(known_sources[:3])
                + "."
            )
            warnings.append("appended_sources")

    banned = [
        (r"chắc chắn bạn bị", "removed_diagnosis"),
        (r"bạn phải uống", "removed_prescription"),
    ]
    for pat, tag in banned:
        if re.search(pat, out, re.I):
            warnings.append(tag)
            out = re.sub(pat, "nên trao đổi với bác sĩ về", out, flags=re.I)

    disclaimer = "tham khảo"
    if disclaimer not in out.lower() and "nhân viên y tế" not in out.lower():
        out = out.rstrip() + (
            "\n\nLưu ý: thông tin chỉ mang tính tham khảo, không thay thế tư vấn y tế trực tiếp."
        )
        warnings.append("appended_disclaimer")

    return GuardResult(ok=True, text=out, warnings=warnings)
