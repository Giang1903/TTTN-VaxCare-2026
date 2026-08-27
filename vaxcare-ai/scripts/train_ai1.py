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
MODEL_VERSION = "ai1-xgboost-v1"


def train(data_dir: Path, model_dir: Path) -> dict:
    path = data_dir / "appointment_waittime.csv"
    df = pd.read_csv(path)
    print(f"[AI1] Loaded {len(df)} rows from {path}")

    for col in AI1_FEATURES + [AI1_TARGET]:
        if col not in df.columns:
            raise ValueError(f"Missing column: {col}")

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

    pred = np.clip(model.predict(X_test), 0, None)
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, pred))), 4),
        "r2": round(float(r2_score(y_test, pred)), 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
    }
    print(f"[AI1] Metrics: {metrics}")

    importance = dict(
        zip(AI1_FEATURES, [round(float(x), 4) for x in model.feature_importances_])
    )
    print(f"[AI1] Feature importance: {importance}")

    artifact = {
        "model": model,
        "features": AI1_FEATURES,
        "target": AI1_TARGET,
        "model_version": MODEL_VERSION,
        "metrics": metrics,
        "feature_importance": importance,
    }
    model_dir.mkdir(parents=True, exist_ok=True)
    out = model_dir / "ai1_waittime.joblib"
    joblib.dump(artifact, out)
    print(f"[AI1] Saved → {out}")

    (model_dir / "ai1_metrics.json").write_text(
        json.dumps(
            {"version": MODEL_VERSION, "metrics": metrics, "importance": importance},
            indent=2,
        ),
        encoding="utf-8",
    )
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--model-dir", type=Path, default=Path("models"))
    args = parser.parse_args()
    train(args.data_dir, args.model_dir)
    