from __future__ import annotations

import math
from datetime import date, timedelta
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

from app.core.config import settings
from app.schemas.demand import (
    ConsumptionPoint,
    ForecastPeriod,
    ForecastRequest,
    ForecastResponse,
)

# Feature columns used when the trained model is available
FEATURE_COLS = [
    "lag_1",
    "lag_7",
    "lag_14",
    "roll_mean_7",
    "roll_mean_14",
    "day_of_week",
    "month",
    "is_weekend",
]


@lru_cache(maxsize=1)
def _load_model():
    path = settings.model_dir / settings.demand_model_name
    if not path.exists():
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None


def model_version() -> str:
    art = _load_model()
    if art:
        return art.get("model_version", "ai2-xgboost-v1")
    return "ai2-heuristic-v1"


def _history_to_series(history: List[ConsumptionPoint]) -> pd.Series:
    """Chuyển list history → Series index = date, value = quantity (điền 0 ngày thiếu)."""
    if not history:
        return pd.Series(dtype=float)

    records = sorted(
        ((p.period_date, max(0, int(p.quantity))) for p in history),
        key=lambda x: x[0],
    )
    idx = pd.DatetimeIndex([r[0] for r in records])
    s = pd.Series([r[1] for r in records], index=idx, dtype=float)
    s = s[~s.index.duplicated(keep="last")].sort_index()

    # Điền ngày thiếu trong khoảng [min, max] bằng 0
    full_idx = pd.date_range(s.index.min(), s.index.max(), freq="D")
    s = s.reindex(full_idx, fill_value=0.0)
    return s


def _build_features_for_day(
    series: pd.Series,
    target_date: date,
) -> Optional[Dict[str, float]]:
    """
    Xây feature vector cho một ngày dự báo dựa trên series lịch sử đã biết
    (chỉ dùng dữ liệu < target_date).
    """
    ts = pd.Timestamp(target_date)
    hist = series[series.index < ts]
    if hist.empty:
        return None

    def _lag(n: int) -> float:
        t = ts - pd.Timedelta(days=n)
        if t in hist.index:
            return float(hist.loc[t])
        return 0.0

    def _roll(window: int) -> float:
        start = ts - pd.Timedelta(days=window)
        window_vals = hist[(hist.index >= start) & (hist.index < ts)]
        if window_vals.empty:
            return float(hist.iloc[-1]) if len(hist) else 0.0
        return float(window_vals.mean())

    dow = target_date.weekday()  # 0=Mon
    return {
        "lag_1": _lag(1),
        "lag_7": _lag(7),
        "lag_14": _lag(14),
        "roll_mean_7": _roll(7),
        "roll_mean_14": _roll(14),
        "day_of_week": float(dow),
        "month": float(target_date.month),
        "is_weekend": 1.0 if dow >= 5 else 0.0,
    }


def _predict_daily_with_model(
    series: pd.Series,
    start: date,
    n_days: int,
) -> List[float]:
    """Dự báo từng ngày bằng model; cập nhật series ảo để lag đúng."""
    art = _load_model()
    if art is None:
        return []

    model = art["model"]
    feat_cols = art.get("feature_cols", FEATURE_COLS)
    working = series.copy()
    preds: List[float] = []

    for i in range(n_days):
        d = start + timedelta(days=i)
        feats = _build_features_for_day(working, d)
        if feats is None:
            # không đủ history → dùng mean gần nhất
            pred = float(working.tail(7).mean()) if len(working) else 0.0
        else:
            X = np.array([[feats.get(c, 0.0) for c in feat_cols]], dtype=float)
            pred = float(model.predict(X)[0])
            pred = max(0.0, pred)

        preds.append(pred)
        # append predicted value so next lags see it
        working.loc[pd.Timestamp(d)] = pred

    return preds


def _predict_daily_heuristic(
    series: pd.Series,
    start: date,
    n_days: int,
) -> List[float]:
    """
    Fallback: trung bình có trọng số của 7 / 14 ngày gần nhất,
    điều chỉnh nhẹ theo day-of-week (cuối tuần thường thấp hơn).
    """
    if series.empty:
        return [0.0] * n_days

    recent_7 = series.tail(7)
    recent_14 = series.tail(14)
    base = float(0.6 * recent_7.mean() + 0.4 * recent_14.mean()) if len(recent_14) else float(series.mean())

    # profile theo thứ trong tuần từ lịch sử
    dow_means: Dict[int, float] = {}
    if len(series) >= 7:
        tmp = series.copy()
        tmp.index = pd.DatetimeIndex(tmp.index)
        for dow in range(7):
            mask = tmp.index.dayofweek == dow
            if mask.any():
                dow_means[dow] = float(tmp[mask].mean())
    global_mean = float(series.mean()) or 1.0

    preds: List[float] = []
    for i in range(n_days):
        d = start + timedelta(days=i)
        dow = d.weekday()
        factor = (dow_means.get(dow, global_mean) / global_mean) if global_mean > 0 else 1.0
        # weekend nhẹ hơn nếu không có profile
        if dow >= 5 and dow not in dow_means:
            factor = 0.75
        preds.append(max(0.0, base * factor))
    return preds


def _aggregate_to_periods(
    daily_preds: List[float],
    start: date,
    period_days: int,
    residual_std: float,
) -> List[ForecastPeriod]:
    """Gom dự báo ngày → các bucket period_days."""
    if not daily_preds:
        return []

    periods: List[ForecastPeriod] = []
    n = len(daily_preds)
    i = 0
    while i < n:
        chunk = daily_preds[i : i + period_days]
        p_start = start + timedelta(days=i)
        p_end = start + timedelta(days=i + len(chunk) - 1)
        total = float(sum(chunk))
        predicted = int(round(total))

        # confidence: càng nhiều history / residual nhỏ → cao hơn
        # bound dựa trên residual_std * sqrt(n_days in period)
        std_period = residual_std * math.sqrt(len(chunk))
        lower = max(0, int(round(total - 1.28 * std_period)))  # ~80%
        upper = int(round(total + 1.28 * std_period))

        # confidence level heuristic
        if residual_std <= 0:
            conf = 0.55
        else:
            cv = residual_std / (total / max(len(chunk), 1) + 1e-6)
            conf = float(max(0.4, min(0.95, 1.0 - 0.35 * cv)))

        periods.append(
            ForecastPeriod(
                forecast_period_start=p_start,
                forecast_period_end=p_end,
                predicted_quantity=predicted,
                confidence_level=round(conf, 3),
                lower_bound=lower,
                upper_bound=max(upper, predicted),
            )
        )
        i += period_days

    return periods


def _estimate_residual_std(series: pd.Series) -> float:
    """Ước lượng std của residual (naive: std của diff 1 ngày gần đây)."""
    if len(series) < 3:
        return float(series.std()) if len(series) > 1 else 3.0
    diffs = series.diff().dropna().tail(21)
    if diffs.empty:
        return 3.0
    return float(max(1.0, diffs.std()))


def forecast_demand(req: ForecastRequest) -> ForecastResponse:
    """
    Entry point AI2:
    - Dùng model XGBoost nếu có file .joblib
    - Không có model / history quá ngắn → heuristic
    """
    series = _history_to_series(req.history)
    horizon = req.horizon_days
    period_days = req.period_days

    # ngày bắt đầu dự báo = ngày sau điểm history cuối (hoặc hôm nay nếu rỗng)
    if series.empty:
        start = date.today()
    else:
        last = series.index.max().date()
        start = last + timedelta(days=1)

    residual_std = _estimate_residual_std(series)

    art = _load_model()
    min_points = settings.demand_min_history_points

    if art is not None and len(series) >= min_points:
        daily = _predict_daily_with_model(series, start, horizon)
        version = model_version()
    else:
        daily = _predict_daily_heuristic(series, start, horizon)
        version = "ai2-heuristic-v1"

    periods = _aggregate_to_periods(daily, start, period_days, residual_std)

    return ForecastResponse(
        vaccine_id=req.vaccine_id,
        facility_id=req.facility_id,
        model_version=version,
        forecasts=periods,
    )