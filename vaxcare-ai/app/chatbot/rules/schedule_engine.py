from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

import pandas as pd

from app.chatbot.rules.age_rules_loader import (
    expected_doses_by_vaccine,
    load_age_rules,
    rules_for_age,
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


def advise_schedule(
    age_months: float | int | None = None,
    age_years: float | int | None = None,
    completed: set[tuple[int, int]] | None = None,
    df: pd.DataFrame | None = None,
    max_items: int = 12,
) -> ScheduleResult:
    """
    Trả về các mũi nên quan tâm ở độ tuổi hiện tại.

    completed: set of (vaccine_id, dose_number) đã tiêm (nếu có).
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
    expected = expected_doses_by_vaccine(age_months, df)

    recommendations: list[DoseAdvice] = []
    by_vaccine: dict[int, list[DoseAdvice]] = {}
    sources: set[str] = set()

    for vid, doses in sorted(expected.items(), key=lambda x: x[0]):
        vaccine_items: list[DoseAdvice] = []
        for d in doses:
            dose_num = int(d["dose_number"])
            key = (vid, dose_num)
            short = str(d.get("vaccine_short") or "")
            source = str(d.get("source_doc") or "")
            tier = str(d.get("tier") or "")
            note = str(d.get("note") or "")
            age_group = str(d.get("age_group") or "")
            interval = d.get("interval_days_min")
            try:
                interval = int(interval) if pd.notna(interval) else None
            except (TypeError, ValueError):
                interval = None

            if key in completed:
                status = "completed"
            else:
                # Mũi đầu trong chuỗi chưa tiêm → recommended; các mũi sau → upcoming
                prev_done = all(
                    (vid, int(prev["dose_number"])) in completed
                    for prev in doses
                    if int(prev["dose_number"]) < dose_num
                )
                status = "recommended" if prev_done or dose_num == 1 else "upcoming"

            advice = DoseAdvice(
                vaccine_id=vid,
                vaccine_short=short,
                dose_number=dose_num,
                status=status,
                age_group=age_group,
                interval_days_min=interval,
                note=note,
                source_doc=source,
                tier=tier,
            )
            vaccine_items.append(advice)
            if source:
                sources.add(source)

        by_vaccine[vid] = vaccine_items
        # Ưu tiên đưa các mũi recommended lên danh sách chính
        for a in vaccine_items:
            if a.status == "recommended":
                recommendations.append(a)

    # Nếu quá ít recommended, bổ sung upcoming (giới hạn)
    if len(recommendations) < 3:
        for vid, items in by_vaccine.items():
            for a in items:
                if a.status == "upcoming" and a not in recommendations:
                    recommendations.append(a)
                if len(recommendations) >= max_items:
                    break

    recommendations = recommendations[:max_items]

    # Tóm tắt ngắn
    rec_names = []
    seen = set()
    for a in recommendations:
        if a.status == "recommended" and a.vaccine_short not in seen:
            rec_names.append(f"{a.vaccine_short} (mũi {a.dose_number})")
            seen.add(a.vaccine_short)
    if rec_names:
        summary = (
            f"Ở khoảng {age_years:.1f} tuổi ({int(age_months)} tháng), "
            f"các mũi nên quan tâm: {', '.join(rec_names[:8])}."
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


def format_schedule_text(result: ScheduleResult, max_lines: int = 8) -> str:
    """Chuyển ScheduleResult thành đoạn văn tiếng Việt ngắn gọn."""
    lines = [result.summary]
    shown = 0
    for a in result.recommendations:
        if a.status not in ("recommended", "upcoming"):
            continue
        status_vi = "nên kiểm tra / tiêm" if a.status == "recommended" else "mũi tiếp theo trong phác đồ"
        extra = f" — {a.note}" if a.note else ""
        lines.append(
            f"- {a.vaccine_short} mũi {a.dose_number}: {status_vi}{extra}"
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
