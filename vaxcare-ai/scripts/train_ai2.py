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

# Feature set suy ra được từ history API (không phụ thuộc price/stock lúc infer)
AI2_FEATURES = [
    "facility_id",
    "vaccine_id",
    "day_of_week",
    "month",
    "is_weekend",
    "lag_1",
    "lag_7",
    "lag_14",
    "rolling_mean_7",
]
AI2_TARGET = "usage_count"
MODEL_VERSION = "ai2-xgboost-v1"
MIN_HISTORY_DAYS = 14


def _add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["facility_id", "vaccine_id", "date"]).copy()
    df["date"] = pd.to_datetime(df["date"])
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    g = df.groupby(["facility_id", "vaccine_id"], group_keys=False)
    df["lag_1"] = g["usage_count"].shift(1)
    df["lag_7"] = g["usage_count"].shift(7)
    df["lag_14"] = g["usage_count"].shift(14)
    df["rolling_mean_7"] = g["usage_count"].transform(
        lambda s: s.shift(1).rolling(7, min_periods=1).mean()
    )

    for col in ["lag_1", "lag_7", "lag_14", "rolling_mean_7"]:
        df[col] = df[col].fillna(df.groupby(["facility_id", "vaccine_id"])["usage_count"].transform("mean"))
        df[col] = df[col].fillna(0)
    return df


def train(data_dir: Path, model_dir: Path) -> dict:
    path = data_dir / "vaccine_demand.csv"
    df = pd.read_csv(path)
    print(f"[AI2] Loaded {len(df)} rows from {path}")

    df = _add_time_features(df)
    # Bỏ hàng đầu thiếu lag
    df = df.dropna(subset=AI2_FEATURES + [AI2_TARGET])
    print(f"[AI2] After features: {len(df)} rows")

    X = df[AI2_FEATURES]
    y = df[AI2_TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=2,
        reg_lambda=1.0,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    pred = np.clip(model.predict(X_test), 0, None)
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, pred))), 4),
        "r2": round(float(r2_score(y_test, pred)), 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
    }
    print(f"[AI2] Metrics: {metrics}")

    # Feature importance
    importance = dict(zip(AI2_FEATURES, [round(float(x), 4) for x in model.feature_importances_]))
    print(f"[AI2] Feature importance: {importance}")

    artifact = {
        "model": model,
        "features": AI2_FEATURES,
        "target": AI2_TARGET,
        "model_version": MODEL_VERSION,
        "metrics": metrics,
        "feature_importance": importance,
        "min_history_days": MIN_HISTORY_DAYS,
    }
    model_dir.mkdir(parents=True, exist_ok=True)
    out = model_dir / "ai2_demand.joblib"
    joblib.dump(artifact, out)
    print(f"[AI2] Saved → {out}")

    (model_dir / "ai2_metrics.json").write_text(
        json.dumps({"version": MODEL_VERSION, "metrics": metrics, "importance": importance}, indent=2),
        encoding="utf-8",
    )
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--model-dir", type=Path, default=Path("models"))
    args = parser.parse_args()
    train(args.data_dir, args.model_dir)
