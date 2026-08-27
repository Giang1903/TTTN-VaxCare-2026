from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

# ---------- Feature sets (must match inference code) ----------
AI1_FEATURES = [
    "day_of_week",
    "is_weekend",
    "is_holiday",
    "hour",
    "capacity",
    "booked",
    "occupancy_rate",
]
AI1_TARGET = "wait_time_minutes"

AI2_FEATURES = [
    "facility_id",
    "vaccine_id",
    "category_id",
    "required_doses",
    "average_rating",
    "price",
    "day_of_week",
    "month",
    "is_weekend",
    "current_stock",
    "days_to_expiry",
    "lag_7",
    "lag_14",
]
AI2_TARGET = "usage_count"

MODEL_VERSION_AI1 = "ai1-xgboost-v1"
MODEL_VERSION_AI2 = "ai2-xgboost-v1"


def _metrics(y_true, y_pred) -> dict:
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
        "r2": round(float(r2_score(y_true, y_pred)), 4),
    }


def train_ai1(data_dir: Path, model_dir: Path) -> dict:
    path = data_dir / "appointment_waittime.csv"
    df = pd.read_csv(path)
    print(f"[AI1] Loaded {len(df)} rows from {path.name}")

    for col in AI1_FEATURES + [AI1_TARGET]:
        if col not in df.columns:
            raise ValueError(f"[AI1] Missing column: {col}")

    X = df[AI1_FEATURES]
    y = df[AI1_TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=3,
        reg_lambda=1.0,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    metrics = _metrics(y_test, pred)
    print(f"[AI1] Test metrics: {metrics}")

    artifact = {
        "model": model,
        "features": AI1_FEATURES,
        "target": AI1_TARGET,
        "model_version": MODEL_VERSION_AI1,
        "metrics": metrics,
    }
    out = model_dir / "ai1_waittime.joblib"
    joblib.dump(artifact, out)
    print(f"[AI1] Saved → {out}")
    return metrics


def _add_lags(df: pd.DataFrame) -> pd.DataFrame:
    """Add lag_7 / lag_14 usage per (facility_id, vaccine_id)."""
    df = df.sort_values(["facility_id", "vaccine_id", "date"]).copy()
    g = df.groupby(["facility_id", "vaccine_id"], group_keys=False)
    df["lag_7"] = g["usage_count"].shift(7)
    df["lag_14"] = g["usage_count"].shift(14)
    # Fill early rows with group mean / 0
    df["lag_7"] = df["lag_7"].fillna(df.groupby(["facility_id", "vaccine_id"])["usage_count"].transform("mean"))
    df["lag_14"] = df["lag_14"].fillna(df["lag_7"])
    df["lag_7"] = df["lag_7"].fillna(0)
    df["lag_14"] = df["lag_14"].fillna(0)
    return df


def train_ai2(data_dir: Path, model_dir: Path) -> dict:
    path = data_dir / "vaccine_demand.csv"
    df = pd.read_csv(path)
    print(f"[AI2] Loaded {len(df)} rows from {path.name}")

    df = _add_lags(df)

    for col in AI2_FEATURES + [AI2_TARGET]:
        if col not in df.columns:
            raise ValueError(f"[AI2] Missing column: {col}")

    X = df[AI2_FEATURES]
    y = df[AI2_TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=250,
        max_depth=7,
        learning_rate=0.07,
        subsample=0.85,
        colsample_bytree=0.8,
        min_child_weight=2,
        reg_lambda=1.2,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    pred = model.predict(X_test)
    # usage cannot be negative
    pred = np.clip(pred, 0, None)
    metrics = _metrics(y_test, pred)
    print(f"[AI2] Test metrics: {metrics}")

    artifact = {
        "model": model,
        "features": AI2_FEATURES,
        "target": AI2_TARGET,
        "model_version": MODEL_VERSION_AI2,
        "metrics": metrics,
    }
    out = model_dir / "ai2_demand.joblib"
    joblib.dump(artifact, out)
    print(f"[AI2] Saved → {out}")
    return metrics


def main():
    parser = argparse.ArgumentParser(description="Train VaxCare XGBoost models")
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--model-dir", type=Path, default=Path("models"))
    args = parser.parse_args()

    args.model_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 50)
    m1 = train_ai1(args.data_dir, args.model_dir)
    print("=" * 50)
    m2 = train_ai2(args.data_dir, args.model_dir)
    print("=" * 50)

    summary = {
        "ai1_waittime": {"version": MODEL_VERSION_AI1, "metrics": m1},
        "ai2_demand": {"version": MODEL_VERSION_AI2, "metrics": m2},
    }
    summary_path = args.model_dir / "metrics.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Summary → {summary_path}")
    print("Done.")


if __name__ == "__main__":
    main()
