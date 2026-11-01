from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

DEFAULT_RULES_PATH = (
    Path(__file__).resolve().parents[3] / "knowledge" / "rules" / "age_rules.csv"
)


def load_age_rules(path: str | Path | None = None) -> pd.DataFrame:
    p = Path(path) if path else DEFAULT_RULES_PATH
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

    for col in ("age_from_months", "age_to_months", "vaccine_id", "dose_number", "interval_days_min"):
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


def expected_doses_by_vaccine(age_months: float | int, df: pd.DataFrame | None = None) -> dict[int, list[dict[str, Any]]]:
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


if __name__ == "__main__":
    rules = load_age_rules()
    print(f"Loaded {len(rules)} rules from {DEFAULT_RULES_PATH}")
    print(rules.head(3).to_string())
    print("--- age 14 months ---")
    print(rules_for_age(14).to_string())
