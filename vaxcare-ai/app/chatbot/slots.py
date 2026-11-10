from __future__ import annotations

import re
from typing import Any


_CONFIRM_YES = re.compile(
    r"^(ok|oke|okay|được|đúng|đúng rồi|vâng|vàng|ừ|ừm|um|yes|y|"
    r"đúng vậy|chuẩn|đồng ý|tiếp tục|tư vấn đi|theo hồ sơ|"
    r"cho (tôi|mình)|là (tôi|mình)|đúng (tôi|mình))",
    re.I,
)
_CONFIRM_OTHER = re.compile(
    r"(người khác|cho (con|bé|cháu|vợ|chồng|mẹ|bố|ba|má)|"
    r"không phải (tôi|mình)|cho bé|con tôi|bé nhà)",
    re.I,
)
_SUBJECT_CHILD = re.compile(
    r"(con|bé|cháu|trẻ|nhà mình \d|bé nhà)",
    re.I,
)


def is_affirmative(message: str) -> bool:
    t = (message or "").strip()
    if not t:
        return False
    # Câu ngắn xác nhận
    if len(t) <= 40 and _CONFIRM_YES.search(t):
        return True
    if re.search(r"\b(đúng|được|ok|vâng|theo hồ sơ|tiếp tục)\b", t, re.I) and len(t) <= 60:
        return True
    return False


def is_asking_for_other_person(message: str) -> bool:
    return bool(_CONFIRM_OTHER.search(message or ""))


def detect_subject(message: str, soft: dict[str, Any] | None = None) -> str | None:
    """self | child | other | None"""
    t = message or ""
    if _SUBJECT_CHILD.search(t) or re.search(r"\b\d+\s*(tuổi|tháng)\b", t) and re.search(
        r"(bé|con|cháu|trẻ)", t, re.I
    ):
        return "child"
    if is_asking_for_other_person(t):
        return "other"
    if soft and soft.get("subject"):
        return soft["subject"]
    return None


def age_from_context(ctx: dict[str, Any] | None) -> tuple[float | None, int | None]:
    if not ctx:
        return None, None
    years = ctx.get("age_years")
    months = ctx.get("age_months")
    if years is None and ctx.get("date_of_birth"):
        years, months = age_from_dob(str(ctx["date_of_birth"]))
    try:
        years_f = float(years) if years is not None else None
    except (TypeError, ValueError):
        years_f = None
    try:
        months_i = int(months) if months is not None else None
    except (TypeError, ValueError):
        months_i = None
    if years_f is not None and months_i is None:
        months_i = int(round(years_f * 12))
    if months_i is not None and years_f is None:
        years_f = months_i / 12.0
    return years_f, months_i


def age_from_dob(dob: str) -> tuple[float | None, int | None]:
    """Parse YYYY-MM-DD or DD/MM/YYYY → (age_years, age_months)."""
    from datetime import date, datetime

    dob = (dob or "").strip()
    if not dob:
        return None, None
    parsed = None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            parsed = datetime.strptime(dob[:10], fmt).date()
            break
        except ValueError:
            continue
    if parsed is None:
        return None, None
    today = date.today()
    months = (today.year - parsed.year) * 12 + (today.month - parsed.month)
    if today.day < parsed.day:
        months -= 1
    if months < 0:
        return None, None
    return round(months / 12.0, 2), months


def resolve_age(
    entities: dict[str, Any] | None,
    context: dict[str, Any] | None,
    soft: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Trả về:
      age_years, age_months, source (user_message|memory|profile|none),
      needs_age, needs_confirm, profile_available
    """
    entities = entities or {}
    context = context or {}
    soft = soft or {}

    e_years = entities.get("age_years")
    e_months = entities.get("age_months")
    s_years = soft.get("age_years")
    s_months = soft.get("age_months")
    p_years, p_months = age_from_context(context)
    # profile may also nest under context["profile"]
    if p_years is None and isinstance(context.get("profile"), dict):
        p_years, p_months = age_from_context(context["profile"])

    profile_available = p_years is not None or p_months is not None
    confirmed = bool(soft.get("age_confirmed") or context.get("profile_confirmed"))

    # Ưu tiên: user message > memory confirmed > profile
    if e_years is not None or e_months is not None:
        years = e_years
        months = e_months
        if years is not None and months is None:
            months = int(round(float(years) * 12))
        if months is not None and years is None:
            years = float(months) / 12.0
        return {
            "age_years": float(years) if years is not None else None,
            "age_months": int(months) if months is not None else None,
            "source": "user_message",
            "needs_age": False,
            "needs_confirm": False,
            "profile_available": profile_available,
            "subject": detect_subject("", soft) or soft.get("subject"),
        }

    if s_years is not None or s_months is not None:
        # Memory: nếu trước đó user nói tuổi → coi như confirmed
        src = soft.get("age_source") or "memory"
        needs_confirm = src == "profile" and not confirmed
        years = s_years
        months = s_months
        if years is not None and months is None:
            months = int(round(float(years) * 12))
        if months is not None and years is None:
            years = float(months) / 12.0
        return {
            "age_years": float(years) if years is not None else None,
            "age_months": int(months) if months is not None else None,
            "source": src,
            "needs_age": False,
            "needs_confirm": needs_confirm,
            "profile_available": profile_available,
            "subject": soft.get("subject"),
        }

    if profile_available:
        return {
            "age_years": float(p_years) if p_years is not None else None,
            "age_months": int(p_months) if p_months is not None else None,
            "source": "profile",
            "needs_age": False,
            "needs_confirm": not confirmed,
            "profile_available": True,
            "subject": soft.get("subject") or "self",
        }

    return {
        "age_years": None,
        "age_months": None,
        "source": "none",
        "needs_age": True,
        "needs_confirm": False,
        "profile_available": False,
        "subject": soft.get("subject"),
    }
