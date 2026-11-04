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


def _collapse_repetition(text: str, max_consecutive: int = 3) -> tuple[str, bool]:
    """
    Phát hiện và cắt cụm từ lặp liên tiếp (n-gram 2–6 từ).
    Trả về (text_đã_cắt, có_cắt_hay_không).
    """
    if not text or len(text) < 40:
        return text, False

    words = text.split()
    if len(words) < 12:
        return text, False

    for n in range(2, 7):
        i = 0
        while i <= len(words) - n * max_consecutive:
            phrase = words[i : i + n]
            count = 1
            j = i + n
            while j + n <= len(words) and words[j : j + n] == phrase:
                count += 1
                j += n
            if count >= max_consecutive:
                # Giữ lại 1 lần xuất hiện + dấu "…"
                kept = words[: i + n]
                return " ".join(kept).rstrip(" ,.;") + "…", True
            i += 1

    # Fallback: lặp ký tự / cụm ngắn kiểu "da đầu và cổ, da đầu và cổ"
    m = re.search(
        r"(.{8,40}?)(?:\s*[,;]?\s*\1){3,}",
        text,
        flags=re.DOTALL,
    )
    if m:
        start = m.start()
        cleaned = text[: start + len(m.group(1))].rstrip(" ,.;") + "…"
        return cleaned, True

    return text, False


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

    # Chống vòng lặp generation (model nhỏ dễ bị)
    out, was_collapsed = _collapse_repetition(out)
    if was_collapsed:
        warnings.append("collapsed_repetition")

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
