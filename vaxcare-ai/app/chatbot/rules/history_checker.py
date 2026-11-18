from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from typing import Any, Iterable

import pandas as pd

from app.chatbot.rules.age_rules_loader import expected_doses_by_vaccine, load_age_rules
from app.chatbot.rules.schedule_engine import DoseAdvice, advise_schedule


@dataclass
class HistoryItem:
    vaccine_id: int
    vaccine_short: str
    dose_number: int
    status: str 
    injection_date: str | None = None
    note: str = ""
    source_doc: str = ""


@dataclass
class HistoryCheckResult:
    age_months: float
    age_years: float
    completed: list[HistoryItem] = field(default_factory=list)
    missing: list[HistoryItem] = field(default_factory=list)
    next_steps: list[HistoryItem] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    summary: str = ""
    has_records: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "age_months": self.age_months,
            "age_years": self.age_years,
            "completed": [asdict(x) for x in self.completed],
            "missing": [asdict(x) for x in self.missing],
            "next_steps": [asdict(x) for x in self.next_steps],
            "sources": self.sources,
            "summary": self.summary,
            "has_records": self.has_records,
        }


def _parse_records(records: Iterable[dict[str, Any]] | None) -> set[tuple[int, int]]:
    done: set[tuple[int, int]] = set()
    if not records:
        return done
    for r in records:
        vid = r.get("vaccine_id")
        dose = r.get("dose_number")
        if vid is None or dose is None:
            continue
        try:
            done.add((int(vid), int(dose)))
        except (TypeError, ValueError):
            continue
    return done


def _record_map(records: Iterable[dict[str, Any]] | None) -> dict[tuple[int, int], dict]:
    m: dict[tuple[int, int], dict] = {}
    if not records:
        return m
    for r in records:
        try:
            key = (int(r["vaccine_id"]), int(r["dose_number"]))
            m[key] = r
        except (KeyError, TypeError, ValueError):
            continue
    return m


def check_history(
    age_months: float | int | None = None,
    age_years: float | int | None = None,
    records: list[dict[str, Any]] | None = None,
    df: pd.DataFrame | None = None,
) -> HistoryCheckResult:
    """
    So sánh records với expected doses theo tuổi.
    """
    if age_months is None:
        if age_years is None:
            raise ValueError("Cần age_months hoặc age_years")
        age_months = float(age_years) * 12.0
    age_months = float(age_months)
    age_years = age_months / 12.0

    if df is None:
        df = load_age_rules()

    done_keys = _parse_records(records)
    rec_map = _record_map(records)
    expected = expected_doses_by_vaccine(age_months, df)

    completed: list[HistoryItem] = []
    missing: list[HistoryItem] = []
    next_steps: list[HistoryItem] = []
    sources: set[str] = set()

    for vid, doses in sorted(expected.items(), key=lambda x: x[0]):
        for d in doses:
            dose_num = int(d["dose_number"])
            key = (vid, dose_num)
            short = str(d.get("vaccine_short") or "")
            source = str(d.get("source_doc") or "")
            note = str(d.get("note") or "")
            if source:
                sources.add(source)

            if key in done_keys:
                inj = rec_map.get(key, {}).get("injection_date")
                completed.append(
                    HistoryItem(
                        vaccine_id=vid,
                        vaccine_short=short,
                        dose_number=dose_num,
                        status="completed",
                        injection_date=str(inj) if inj else None,
                        note=note,
                        source_doc=source,
                    )
                )
            else:
                # missing nếu mũi trước đã có hoặc là mũi 1
                prev_ok = all(
                    (vid, int(prev["dose_number"])) in done_keys
                    for prev in doses
                    if int(prev["dose_number"]) < dose_num
                )
                status = "missing" if (dose_num == 1 or prev_ok) else "upcoming_chain"
                item = HistoryItem(
                    vaccine_id=vid,
                    vaccine_short=short,
                    dose_number=dose_num,
                    status=status if status == "missing" else "missing",
                    note=note,
                    source_doc=source,
                )
                missing.append(item)
                if dose_num == 1 or prev_ok:
                    next_steps.append(
                        HistoryItem(
                            vaccine_id=vid,
                            vaccine_short=short,
                            dose_number=dose_num,
                            status="next_due",
                            note=note,
                            source_doc=source,
                        )
                    )

    # Tóm tắt
    has_records = bool(records)
    if not has_records:
        summary = (
            f"Chưa có dữ liệu tiêm trong hồ sơ. "
            f"Theo độ tuổi ~{age_years:.1f} tuổi, "
            f"có {len(missing)} mốc tham khảo cần kiểm tra / bổ sung."
        )
    else:
        summary = (
            f"Đã ghi nhận {len(completed)} mũi. "
            f"Còn khoảng {len(next_steps)} mũi nên ưu tiên kiểm tra tiếp "
            f"(trong số {len(missing)} mốc còn thiếu so với lịch tham khảo)."
        )

    # Ưu tiên next_steps gọn
    next_steps = next_steps[:10]

    return HistoryCheckResult(
        age_months=age_months,
        age_years=round(age_years, 2),
        completed=completed,
        missing=missing,
        next_steps=next_steps,
        sources=sorted(sources),
        summary=summary,
        has_records=has_records,
    )


def format_history_text(result: HistoryCheckResult, max_missing: int = 6) -> str:
    lines = [result.summary]
    if result.completed:
        names = [
            f"{c.vaccine_short} mũi {c.dose_number}"
            for c in result.completed[:6]
        ]
        lines.append("Đã có trong hồ sơ: " + ", ".join(names) + ".")
    if result.next_steps:
        lines.append("Ưu tiên kiểm tra / tiêm tiếp:")
        for n in result.next_steps[:max_missing]:
            extra = f" ({n.note})" if n.note else ""
            lines.append(f"- {n.vaccine_short} mũi {n.dose_number}{extra}")
    if result.sources:
        lines.append(f"Nguồn: {', '.join(result.sources[:3])}.")
    lines.append(
        "Thông tin chỉ mang tính tham khảo theo lịch khuyến cáo; "
        "hãy đối chiếu với sổ tiêm / nhân viên y tế trước khi quyết định."
    )
    return "\n".join(lines)
