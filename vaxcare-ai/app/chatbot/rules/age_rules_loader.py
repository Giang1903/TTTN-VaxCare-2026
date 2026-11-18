from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_RULES_PATH = _ROOT / "knowledge" / "age_rules.csv"
_ALT_RULES_PATH = _ROOT / "knowledge" / "rules" / "age_rules.csv"


def load_age_rules(path: str | Path | None = None) -> pd.DataFrame:
    if path:
        p = Path(path)
    else:
        p = DEFAULT_RULES_PATH if DEFAULT_RULES_PATH.exists() else _ALT_RULES_PATH
    if not p.exists():
        raise FileNotFoundError(f"Không tìm thấy age rules: {p}")

    df = pd.read_csv(p)
    required = {
        "rule_id",
        "age_group",
        "age_from_months",
        "age_to_months",
        "vaccine_id",
        "vaccine_short",
        "dose_number",
        "interval_days_min",
        "source_doc",
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"age_rules.csv thiếu cột: {missing}")

    for col in (
        "age_from_months",
        "age_to_months",
        "vaccine_id",
        "dose_number",
        "interval_days_min",
    ):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["note"] = df.get("note", "").fillna("")
    return df


def rules_for_age(age_months: float | int, df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Lọc các rule áp dụng cho độ tuổi (tháng)."""
    if df is None:
        df = load_age_rules()
    am = float(age_months)
    mask = (df["age_from_months"] <= am) & (df["age_to_months"] >= am)
    return df.loc[mask].copy()


def expected_doses_by_vaccine(
    age_months: float | int, df: pd.DataFrame | None = None
) -> dict[int, list[dict[str, Any]]]:
    """
    Trả về map vaccine_id -> list dose rules (đã sort theo dose_number)
    cho độ tuổi hiện tại.
    """
    subset = rules_for_age(age_months, df)
    result: dict[int, list[dict[str, Any]]] = {}
    for _, row in subset.sort_values(["vaccine_id", "dose_number"]).iterrows():
        vid = int(row["vaccine_id"])
        result.setdefault(vid, []).append(row.to_dict())
    return result


def protocol_for_vaccine(
    vaccine_id: int, df: pd.DataFrame | None = None
) -> list[dict[str, Any]]:
    """Toàn bộ mốc trong bảng quy tắc cho một vaccine (không cần tuổi user)."""
    if df is None:
        df = load_age_rules()
    sub = df.loc[df["vaccine_id"] == int(vaccine_id)].sort_values(
        ["dose_number", "age_from_months"]
    )
    return [row.to_dict() for _, row in sub.iterrows()]


def format_protocol_text(rows: list[dict[str, Any]], vaccine_label: str = "") -> str:
    if not rows:
        return ""
    name = vaccine_label or str(rows[0].get("vaccine_short") or "vaccine")
    by_dose: dict[int, list[dict]] = {}
    for r in rows:
        try:
            d = int(r.get("dose_number") or 0)
        except (TypeError, ValueError):
            d = 0
        by_dose.setdefault(d, []).append(r)

    lines = [f"Với {name}, lịch tham khảo thường như sau:"]
    sources = []
    for dose in sorted(by_dose.keys()):
        parts = []
        for r in by_dose[dose]:
            age_g = (r.get("age_group") or "").strip()
            a0, a1 = r.get("age_from_months"), r.get("age_to_months")
            note = (r.get("note") or "").strip()
            src = (r.get("source_doc") or "").strip()
            interval = r.get("interval_days_min")
            if age_g:
                age_bit = age_g
            elif a0 is not None and a1 is not None:
                age_bit = f"{int(a0)}–{int(a1)} tháng" if a0 != a1 else f"{int(a0)} tháng"
            else:
                age_bit = ""
            bit = age_bit
            try:
                if interval is not None and float(interval) > 0:
                    bit = (bit + ", " if bit else "") + f"cách mũi trước ít nhất {int(interval)} ngày"
            except (TypeError, ValueError):
                pass
            if note:
                bit = (bit + " — " if bit else "") + note
            if bit:
                parts.append(bit)
            if src and src not in sources:
                sources.append(src)
        # bỏ trùng
        uniq = []
        for p_ in parts:
            if p_ not in uniq:
                uniq.append(p_)
        if len(uniq) == 1:
            lines.append(f"- Mũi {dose}: {uniq[0]}")
        else:
            lines.append(f"- Mũi {dose}:")
            for u in uniq:
                lines.append(f"  – {u}")
    if sources:
        lines.append("Nguồn: " + ", ".join(sources[:3]) + ".")
    return "\n".join(lines)


if __name__ == "__main__":
    rules = load_age_rules()
    print(f"Loaded {len(rules)} rules from {DEFAULT_RULES_PATH}")
    print(format_protocol_text(protocol_for_vaccine(6), "MMR/Sởi"))