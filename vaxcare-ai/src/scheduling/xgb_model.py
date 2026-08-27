from __future__ import annotations

import math
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np

from src.common.config import settings

_DEFAULT_FEATURES = [
    "day_of_week",
    "is_weekend",
    "is_holiday",
    "hour",
    "capacity",
    "booked",
    "occupancy_rate",
]


@lru_cache(maxsize=1)
def load_ai1_artifact() -> Optional[Dict[str, Any]]:
    candidates = [
        Path(settings.model_dir) / "ai1_waittime.joblib",
        Path("models") / "ai1_waittime.joblib",
    ]
    for path in candidates:
        if path.exists():
            return joblib.load(path)
    return None


def is_xgb_available() -> bool:
    return load_ai1_artifact() is not None


def predict_wait_and_overload(
    *,
    day_of_week: int,
    is_weekend: int,
    is_holiday: int,
    hour: int,
    capacity: int,
    booked: int,
) -> tuple[int, float]:
    occupancy = booked / capacity if capacity > 0 else 1.0
    artifact = load_ai1_artifact()

    if artifact is not None:
        model = artifact["model"]
        features = artifact.get("features", _DEFAULT_FEATURES)
        row = {
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "hour": hour,
            "capacity": capacity,
            "booked": booked,
            "occupancy_rate": round(occupancy, 3),
        }
        X = np.array([[row[f] for f in features]], dtype=float)
        wait = max(0, int(round(float(model.predict(X)[0]))))
    else:
        if occupancy < 0.35:
            wait = 8
        elif occupancy < 0.65:
            wait = 20
        elif occupancy < 0.85:
            wait = 38
        else:
            wait = 60

    if capacity <= 0:
        overload = 1.0
    else:
        ratio = booked / capacity
        exponent = -6.0 * (ratio - 0.8)
        overload = 1.0 / (1.0 + math.exp(exponent))
    overload = round(min(1.0, max(0.0, overload)), 4)
    return wait, overload


def model_version() -> str:
    artifact = load_ai1_artifact()
    if artifact:
        return artifact.get("model_version", "ai1-xgboost-v1")
    return "ai1-rule-based-v1"
