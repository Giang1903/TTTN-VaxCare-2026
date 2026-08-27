from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np

from src.common.config import settings

DEFAULT_FEATURES = [
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


@lru_cache(maxsize=1)
def load_artifact() -> Optional[Dict[str, Any]]:
    path = Path(settings.model_dir) / "ai2_demand.joblib"
    if not path.exists():
        alt = Path("models") / "ai2_demand.joblib"
        if alt.exists():
            return joblib.load(alt)
        return None
    return joblib.load(path)


def is_available() -> bool:
    return load_artifact() is not None


def min_history_days() -> int:
    art = load_artifact()
    if art:
        return int(art.get("min_history_days", 14))
    return 14


def model_version() -> str:
    art = load_artifact()
    if art:
        return art.get("model_version", "ai2-xgboost-v1")
    return "ai2-linear-trend-v1"


def predict_one(features: Dict[str, float]) -> Optional[float]:
    art = load_artifact()
    if art is None:
        return None
    names: List[str] = art.get("features", DEFAULT_FEATURES)
    row = [float(features.get(n, 0.0)) for n in names]
    pred = float(art["model"].predict(np.array([row], dtype=float))[0])
    return max(0.0, pred)
