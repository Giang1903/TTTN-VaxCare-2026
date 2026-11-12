from __future__ import annotations

import re
from dataclasses import dataclass


SUSPICIOUS_NUMBER_PATTERNS = [
    r"\b\d+\s*mg\b",
    r"\b\d+\s*ml\b",
]

_VI_MARKERS = re.compile(
    r"(vắc|vaccine|tiêm|bệnh|phòng|mũi|lịch|nguồn|thông tư|khuyến|"
    r"bạn|của|không|được|trong|với|cho|các|một|này|khi|đã|"
    r"nguyên nhân|đường lây|triệu chứng|tham khảo|nhân viên)",
    re.I,
)
_LATIN_WORD = re.compile(r"[A-Za-z]{3,}")


@dataclass
class GuardResult:
    ok: bool
    text: str
    warnings: list[str]


def _collapse_repetition(text: str, max_consecutive: int = 3) -> tuple[str, bool]:
    if not text or len(text) < 40:
        return text, False

    words = text.split()
    if len(words) < 12:
        return text, False

    for n in range(2, 7):
        i = 0
        while i <= len(words) - n * max_consecutive:
            phrase = tuple(words[i : i + n])
            count = 1
            j = i + n
            while j + n <= len(words) and tuple(words[j : j + n]) == phrase:
                count += 1
                j += n
            if count >= max_consecutive:
                kept = words[: i + n]
                return " ".join(kept).rstrip(" ,.;") + "…", True
            i += 1

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


def _mostly_english(text: str) -> bool:
    """Ước lượng output nghiêng tiếng Anh (model nhỏ hay trả EN)."""
    if not text or len(text) < 40:
        return False
    latin = _LATIN_WORD.findall(text)
    vi = _VI_MARKERS.findall(text)
    if len(latin) < 12:
        return False
    return len(vi) < 3 and len(latin) >= 15



def _strip_prompt_leak(text: str) -> tuple[str, bool]:
    """Bỏ đoạn model copy hướng dẫn nội bộ."""
    if not text:
        return text, False
    bad_markers = (
        "Phân loại câu hỏi",
        "Hãy cùng tôi phân loại",
        "phân loại câu hỏi của bạn",
        "→ trả lời theo ngữ cảnh",
        "Chỉ trả lời nếu ngữ cảnh",
        "Ngữ cảnh truy xuất:",
        "Kết quả sàng lọc sơ bộ",
    )
    changed = False
    lines = []
    for line in text.splitlines():
        if any(m.lower() in line.lower() for m in bad_markers):
            changed = True
            continue
        lines.append(line)
    out = "\n".join(lines).strip()
    if re.search(r"Bạn muốn biết thông tin chi tiết.*\?", out, re.S | re.I):
        parts = re.split(r"Với câu hỏi này:.*?(?=\n|$)", out, maxsplit=1, flags=re.S | re.I)
        if len(parts) > 1 and parts[-1].strip():
            out = parts[-1].strip()
            changed = True
    return out, changed


def _has_unsupported_treatment(text: str) -> bool:
    """Phát hiện bịa điều trị không thuộc phạm vi tiêm chủng thông thường."""
    t = (text or "").lower()
    markers = (
        "kháng sinh", "phẫu thuật", "cắt bỏ", "uống thuốc", "kê đơn",
        "viêm kết mạc", "đường hô hấp", "hóa trị", "xạ trị",
    )
    return any(m in t for m in markers)


def enforce_guardrails(
    text: str,
    require_source_hint: bool = False,
    known_sources: list[str] | None = None,
    question: str | None = None,
) -> GuardResult:
    warnings: list[str] = []
    out = (text or "").strip()

    if not out:
        return GuardResult(
            ok=False,
            text=(
                "Mình chưa soạn được câu trả lời ổn. "
                "Bạn thử hỏi lại rõ hơn hoặc hỏi nhân viên tại cơ sở tiêm nhé."
            ),
            warnings=["empty_output"],
        )

    out, was_collapsed = _collapse_repetition(out)
    if was_collapsed:
        warnings.append("collapsed_repetition")

    out, leaked = _strip_prompt_leak(out)
    if leaked:
        warnings.append("stripped_prompt_leak")

    if _has_unsupported_treatment(out):
        warnings.append("unsupported_treatment")
        out = (
            "Mình chỉ hỗ trợ thông tin tiêm chủng theo tài liệu đã nạp, "
            "không hướng dẫn điều trị hay dùng thuốc. "
            "Bạn hỏi về vaccine (phòng bệnh gì, mấy mũi, đối tượng) hoặc gặp bác sĩ nếu cần khám chữa bệnh."
        )

    if re.search(
        r"(xong được khoảng|cách đây khoảng|khoảng một năm|một năm rưỡi|"
        r"đã tiêm.*cách đây|hoàn thành mũi.*khoảng)",
        out,
        re.I,
    ):
        warnings.append("possible_invented_elapsed_time")

    if _mostly_english(out):
        warnings.append("non_vietnamese_output")
        src = ", ".join((known_sources or [])[:2]) if known_sources else ""
        out = (
            "Mình xin lỗi, câu trả lời vừa rồi không đúng ngôn ngữ. "
            "Bạn hỏi lại bằng tiếng Việt giúp mình, ví dụ «Vaccine HPV phòng bệnh gì?» "
            "hoặc «Phác đồ MMR thế nào?»."
        )
        if src:
            out += f"\n\nNguồn định hướng: {src}."
        return GuardResult(ok=False, text=out, warnings=warnings)

    for p in SUSPICIOUS_NUMBER_PATTERNS:
        if re.search(p, out, re.I):
            warnings.append(f"suspicious_number:{p}")

    if require_source_hint:
        has_src = bool(
            re.search(
                r"(thông tư|quyết định|who|cdc|hdsd|nguồn|tờ hướng dẫn|phác đồ|tcmr)",
                out,
                re.I,
            )
        )
        if known_sources:
            has_src = has_src or any(
                s.lower() in out.lower() for s in known_sources if s
            )
        if not has_src:
            src_list = (known_sources or ["Thông tư 10/2024/TT-BYT", "tài liệu VaxCare"])[:3]
            out = out.rstrip() + (
                "\n\nNguồn: " + ", ".join(src_list) + "."
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

    need_soft = any(
        k in out.lower()
        for k in ("mũi", "phác đồ", "nên tiêm", "chống chỉ định", "lịch tiêm")
    )
    has_soft = any(
        k in out.lower()
        for k in ("tham khảo", "nhân viên y tế", "bác sĩ", "cơ sở tiêm", "xác nhận")
    )
    if need_soft and not has_soft:
        out = out.rstrip() + "\n\nBạn nên xác nhận lại với nhân viên y tế tại cơ sở trước khi tiêm."
        warnings.append("appended_disclaimer")

    return GuardResult(ok=True, text=out, warnings=warnings)
