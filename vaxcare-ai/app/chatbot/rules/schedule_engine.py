from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

import pandas as pd

from app.chatbot.rules.age_rules_loader import load_age_rules

_CATCHUP_KEYWORDS = (
    "tiêm bù",
    "bắt kịp",
    "mọi lứa tuổi",
    "catch",
)


@dataclass
class DoseAdvice:
    vaccine_id: int
    vaccine_short: str
    dose_number: int
    status: str  
    age_group: str = ""
    interval_days_min: int | None = None
    note: str = ""
    source_doc: str = ""
    tier: str = ""
    is_catch_up: bool = False
    priority: int = 50  


@dataclass
class ScheduleResult:
    age_months: float
    age_years: float
    recommendations: list[DoseAdvice] = field(default_factory=list)
    by_vaccine: dict[int, list[DoseAdvice]] = field(default_factory=dict)
    sources: list[str] = field(default_factory=list)
    summary: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "age_months": self.age_months,
            "age_years": self.age_years,
            "recommendations": [asdict(r) for r in self.recommendations],
            "by_vaccine": {
                str(k): [asdict(x) for x in v] for k, v in self.by_vaccine.items()
            },
            "sources": self.sources,
            "summary": self.summary,
        }


def years_to_months(age_years: float | int | None) -> float | None:
    if age_years is None:
        return None
    return float(age_years) * 12.0


def _is_catch_up_row(row: dict[str, Any] | pd.Series) -> bool:
    """Chỉ coi là catch-up khi age_group/note nói rõ tiêm bù / bắt kịp / mọi lứa tuổi.
    Không dùng độ rộng cửa sổ tuổi (HPV 9-14, Shingrix ≥50 vẫn là mốc chính).
    """
    age_group = str(row.get("age_group") or "").lower()
    note = str(row.get("note") or "").lower()
    if any(k in age_group for k in _CATCHUP_KEYWORDS):
        return True
    if "tiêm bù" in note or "bắt kịp" in note:
        return True
    try:
        a0 = float(row.get("age_from_months"))
        a1 = float(row.get("age_to_months"))
        if a0 <= 1 and a1 >= 600:
            return True
    except (TypeError, ValueError):
        pass
    return False


def _row_priority(row: dict[str, Any], age_months: float) -> int:
    """Điểm ưu tiên: mốc đúng tuổi / vừa quá hạn cao hơn catch-up."""
    if _is_catch_up_row(row):
        return 80
    try:
        a0 = float(row["age_from_months"])
        a1 = float(row["age_to_months"])
    except (TypeError, ValueError, KeyError):
        return 50

    if a0 <= age_months <= a1:
        span = max(a1 - a0, 0)
        if span <= 3:
            return 10
        if span <= 12:
            return 20
        return 35

    if a1 < age_months <= a1 + 12:
        return 25

    if age_months < a0 <= age_months + 3:
        return 40

    return 60


def _select_relevant_rows(df: pd.DataFrame, age_months: float) -> pd.DataFrame:
    """
    Chọn rule liên quan tuổi hiện tại:
    - Mốc trong cửa sổ tuổi
    - Mốc quá hạn ≤ 6 tháng (nhắc kiểm tra, không liệt kê cả năm đầu)
    - Mốc sắp tới ≤ 2 tháng
    - Catch-up chỉ giữ phụ
    - Bỏ rule Thai phụ trừ khi tuổi nằm trong cửa sổ thai (hiếm khi dùng age_months thai)
    """
    am = float(age_months)
    rows = []
    for _, row in df.iterrows():
        age_group = str(row.get("age_group") or "")
        # Rule thai phụ không áp cho trẻ / người hỏi tuổi thường
        if "thai phụ" in age_group.lower() or "thai ph" in age_group.lower():
            continue

        try:
            a0 = float(row["age_from_months"])
            a1 = float(row["age_to_months"])
        except (TypeError, ValueError):
            continue

        is_cu = _is_catch_up_row(row)
        in_window = a0 <= am <= a1
        overdue_recent = (not is_cu) and (a1 < am <= a1 + 6)
        upcoming_soon = (not is_cu) and (am < a0 <= am + 2)

        if in_window or overdue_recent or upcoming_soon:
            d = row.to_dict()
            d["_is_catch_up"] = is_cu
            d["_priority"] = _row_priority(row, am)
            if overdue_recent and not in_window:
                d["_overdue"] = True
            elif upcoming_soon and not in_window:
                d["_upcoming_soon"] = True
            else:
                d["_overdue"] = False
                d["_upcoming_soon"] = False
            rows.append(d)

    if not rows:
        return pd.DataFrame()

    out = pd.DataFrame(rows)
    main = out.loc[~out["_is_catch_up"].astype(bool)]
    if len(main) >= 1:
        # Chỉ 1 dòng catch-up phụ để không lấn mốc chính
        cu = out.loc[out["_is_catch_up"].astype(bool)].head(1)
        out = pd.concat([main, cu], ignore_index=True)
    # Giới hạn số mốc overdue: giữ tối đa 4 overdue + mọi in-window
    if "_overdue" in out.columns:
        in_w = out.loc[~out["_overdue"].astype(bool)]
        od = out.loc[out["_overdue"].astype(bool)].sort_values("_priority").head(4)
        out = pd.concat([in_w, od], ignore_index=True)
    for col in ("_overdue", "_upcoming_soon", "_is_catch_up"):
        if col in out.columns:
            out[col] = out[col].fillna(False).astype(bool)
    return out.sort_values(["_priority", "vaccine_id", "dose_number"])


def advise_schedule(
    age_months: float | int | None = None,
    age_years: float | int | None = None,
    completed: set[tuple[int, int]] | None = None,
    df: pd.DataFrame | None = None,
    max_items: int = 10,
) -> ScheduleResult:
    """
    Trả về các mũi nên quan tâm ở độ tuổi hiện tại.
    Ưu tiên mốc lịch theo tuổi; catch-up chỉ khi phù hợp / phụ.
    """
    if age_months is None:
        if age_years is None:
            raise ValueError("Cần age_months hoặc age_years")
        age_months = years_to_months(age_years)
    age_months = float(age_months)
    age_years = age_months / 12.0

    if df is None:
        df = load_age_rules()

    completed = completed or set()
    subset = _select_relevant_rows(df, age_months)

    recommendations: list[DoseAdvice] = []
    by_vaccine: dict[int, list[DoseAdvice]] = {}
    sources: set[str] = set()

    if subset.empty:
        return ScheduleResult(
            age_months=age_months,
            age_years=round(age_years, 2),
            summary=(
                f"Ở khoảng {age_years:.1f} tuổi, chưa có mũi cụ thể trong bảng quy tắc hiện có, "
                "nên hỏi thêm nhân viên y tế hoặc kiểm tra lịch TCMR."
            ),
        )

    for _, d in subset.iterrows():
        vid = int(d["vaccine_id"])
        dose_num = int(d["dose_number"])
        key = (vid, dose_num)
        short = str(d.get("vaccine_short") or "")
        source = str(d.get("source_doc") or "")
        note = str(d.get("note") or "")
        age_group = str(d.get("age_group") or "")
        is_cu = d.get("_is_catch_up") is True or d.get("_is_catch_up") == True
        priority = int(d.get("_priority") or 50)
        overdue = d.get("_overdue") is True
        upcoming_soon = d.get("_upcoming_soon") is True

        interval = d.get("interval_days_min")
        try:
            interval = int(interval) if pd.notna(interval) else None
        except (TypeError, ValueError):
            interval = None

        if key in completed:
            status = "completed"
        elif is_cu:
            status = "catch_up"
        elif overdue:
            status = "overdue"
        elif upcoming_soon:
            status = "upcoming"
        else:
            status = "recommended"

        advice = DoseAdvice(
            vaccine_id=vid,
            vaccine_short=short,
            dose_number=dose_num,
            status=status,
            age_group=age_group,
            interval_days_min=interval,
            note=note,
            source_doc=source,
            is_catch_up=is_cu,
            priority=priority,
        )
        by_vaccine.setdefault(vid, []).append(advice)
        if source:
            sources.add(source)

        if status != "completed":
            recommendations.append(advice)

    status_rank = {
        "overdue": 0,
        "recommended": 1,
        "upcoming": 2,
        "catch_up": 3,
        "completed": 9,
    }
    recommendations.sort(
        key=lambda a: (status_rank.get(a.status, 5), a.priority, a.vaccine_id, a.dose_number)
    )
    recommendations = recommendations[:max_items]

    # Tóm tắt — chỉ nêu mốc chính (không liệt kê cả đống catch-up)
    main_rec = [
        a
        for a in recommendations
        if a.status in ("recommended", "overdue", "upcoming") and not a.is_catch_up
    ]
    rec_names = []
    seen = set()
    for a in main_rec:
        label = f"{a.vaccine_short} (mũi {a.dose_number})"
        if label not in seen:
            rec_names.append(label)
            seen.add(label)

    if rec_names:
        summary = (
            f"Ở khoảng {age_years:.1f} tuổi ({int(age_months)} tháng), "
            f"các mũi nên quan tâm: {', '.join(rec_names[:8])}."
        )
    else:
        cu = [a for a in recommendations if a.is_catch_up]
        if cu:
            names = ", ".join(f"{a.vaccine_short} (mũi {a.dose_number})" for a in cu[:5])
            summary = (
                f"Ở khoảng {age_years:.1f} tuổi ({int(age_months)} tháng), "
                f"không có mốc bắt buộc vừa khớp; có thể xem tiêm bù nếu chưa tiêm: {names}."
            )
        else:
            summary = (
                f"Ở khoảng {age_years:.1f} tuổi, "
                "chưa có mũi cụ thể trong bảng quy tắc hiện có, "
                "nên hỏi thêm nhân viên y tế hoặc kiểm tra lịch TCMR."
            )

    return ScheduleResult(
        age_months=age_months,
        age_years=round(age_years, 2),
        recommendations=recommendations,
        by_vaccine=by_vaccine,
        sources=sorted(sources),
        summary=summary,
    )


def format_schedule_text(result: ScheduleResult, max_lines: int = 10) -> str:
    """Chuyển ScheduleResult thành đoạn văn tiếng Việt ngắn gọn, không cắt note giữa chừng."""
    lines = [result.summary]
    status_vi = {
        "recommended": "nên kiểm tra / tiêm đúng mốc",
        "overdue": "có thể đã tới/qua mốc — nên đối chiếu hồ sơ",
        "upcoming": "mũi tiếp theo trong phác đồ",
        "catch_up": "chỉ khi chưa tiêm đủ (tiêm bù)",
        "completed": "đã ghi nhận",
    }
    shown = 0
    for a in result.recommendations:
        if a.status == "completed":
            continue
        label = status_vi.get(a.status, a.status)
        note = (a.note or "").strip()
        if len(note) > 160:
            cut = note[:157]
            sp = cut.rfind(" ")
            note = (cut[:sp] if sp > 80 else cut) + "…"
        extra = f" — {note}" if note else ""
        age_bit = f" [{a.age_group}]" if a.age_group else ""
        lines.append(
            f"- {a.vaccine_short} mũi {a.dose_number}{age_bit}: {label}{extra}"
        )
        shown += 1
        if shown >= max_lines:
            break

    if result.sources:
        lines.append(f"Nguồn tham khảo: {', '.join(result.sources[:4])}.")
    lines.append(
        "Lưu ý: đây là gợi ý theo lịch tham khảo, không thay thế tư vấn của bác sĩ / cơ sở tiêm chủng."
    )
    return "\n".join(lines)