"""
AI2 – Vaccine demand forecast.

Pipeline:
  1. Nếu có model XGBoost đã train + history đủ dài → dùng XGBoost
  2. Ngược lại → fallback linear trend + day-of-week seasonality (code cũ)

Output giữ nguyên ForecastResponse (không phá BE/FE).
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import List, Optional

import numpy as np
import pandas as pd

from src.api.schemas import ForecastPeriod, ForecastRequest, ForecastResponse
from src.inventory import xgb_model

_MIN_POINTS_FOR_TREND = 3
_Z = 1.28  # ~80% CI


# ---------------------------------------------------------------------------
# Linear-trend baseline (fallback)
# ---------------------------------------------------------------------------

def _to_daily_series(history: List) -> pd.Series:
    df = pd.DataFrame(
        {
            "date": [p.period_date for p in history],
            "quantity": [p.quantity for p in history],
        }
    )
    df = df.groupby("date", as_index=True)["quantity"].sum()
    full_index = pd.date_range(df.index.min(), df.index.max(), freq="D")
    return df.reindex(full_index, fill_value=0)


def _fit_linear_trend(daily: pd.Series) -> tuple[float, float, float]:
    x = np.arange(len(daily), dtype=float)
    y = daily.values.astype(float)
    if len(daily) < _MIN_POINTS_FOR_TREND:
        mean = float(y.mean()) if len(y) else 0.0
        return 0.0, mean, float(y.std()) if len(y) else 0.0
    slope, intercept = np.polyfit(x, y, 1)
    residual_std = float(np.std(y - (slope * x + intercept)))
    return float(slope), float(intercept), residual_std


def _day_of_week_factors(daily: pd.Series) -> dict[int, float]:
    overall_mean = float(daily.mean()) if len(daily) else 0.0
    if overall_mean <= 0:
        return {i: 1.0 for i in range(7)}
    grouped = daily.groupby(daily.index.dayofweek).mean()
    return {
        dow: (float(grouped.get(dow, overall_mean)) / overall_mean if overall_mean else 1.0)
        for dow in range(7)
    }


def _confidence_level(num_points: int) -> float:
    level = 0.5 + min(num_points, 60) / 60 * 0.45
    return round(level, 2)


def _forecast_linear(request: ForecastRequest) -> ForecastResponse:
    daily = _to_daily_series(request.history)
    slope, intercept, residual_std = _fit_linear_trend(daily)
    dow_factors = _day_of_week_factors(daily)

    last_x = len(daily) - 1
    last_date = daily.index[-1].date()
    confidence_level = _confidence_level(len(daily))

    periods: List[ForecastPeriod] = []
    cursor_date = last_date + timedelta(days=1)
    remaining_days = request.horizon_days
    step_index = last_x + 1

    while remaining_days > 0:
        span = min(request.period_days, remaining_days)
        period_start = cursor_date
        period_end = cursor_date + timedelta(days=span - 1)

        period_total = 0.0
        period_variance = 0.0
        for offset in range(span):
            day_index = step_index + offset
            day_date = period_start + timedelta(days=offset)
            base = slope * day_index + intercept
            seasonal = base * dow_factors.get(day_date.weekday(), 1.0)
            daily_pred = max(0.0, seasonal)
            period_total += daily_pred
            period_variance += residual_std**2

        margin = _Z * (period_variance**0.5)
        predicted_quantity = int(round(period_total))
        lower_bound = max(0, int(round(period_total - margin)))
        upper_bound = int(round(period_total + margin))

        periods.append(
            ForecastPeriod(
                forecast_period_start=period_start,
                forecast_period_end=period_end,
                predicted_quantity=predicted_quantity,
                confidence_level=confidence_level,
                lower_bound=lower_bound,
                upper_bound=upper_bound,
            )
        )
        cursor_date = period_end + timedelta(days=1)
        step_index += span
        remaining_days -= span

    return ForecastResponse(
        vaccine_id=request.vaccine_id,
        facility_id=request.facility_id,
        model_version="ai2-linear-trend-v1",
        forecasts=periods,
    )


# ---------------------------------------------------------------------------
# XGBoost path
# ---------------------------------------------------------------------------

def _history_to_frame(history: List) -> pd.DataFrame:
    df = pd.DataFrame(
        {"date": [p.period_date for p in history], "usage_count": [p.quantity for p in history]}
    )
    df["date"] = pd.to_datetime(df["date"])
    df = df.groupby("date", as_index=False)["usage_count"].sum()
    df = df.sort_values("date")
    # fill missing days with 0
    full = pd.date_range(df["date"].min(), df["date"].max(), freq="D")
    df = df.set_index("date").reindex(full, fill_value=0).rename_axis("date").reset_index()
    return df


def _lags_from_series(values: List[float]) -> dict:
    """Compute lag features from a list of daily usage (oldest → newest)."""
    arr = list(values)
    n = len(arr)

    def at(offset: int) -> float:
        if n >= offset:
            return float(arr[-offset])
        return float(np.mean(arr)) if arr else 0.0

    recent = arr[-7:] if n >= 1 else [0.0]
    return {
        "lag_1": at(1),
        "lag_7": at(7),
        "lag_14": at(14),
        "rolling_mean_7": float(np.mean(recent)),
    }


def _forecast_xgboost(request: ForecastRequest) -> Optional[ForecastResponse]:
    if not xgb_model.is_available():
        return None

    hist_df = _history_to_frame(request.history)
    if len(hist_df) < xgb_model.min_history_days():
        return None

    usage_list = hist_df["usage_count"].astype(float).tolist()
    last_date = hist_df["date"].iloc[-1].date()
    confidence_level = _confidence_level(len(hist_df))
    # residual proxy from recent variance
    residual_std = float(np.std(usage_list[-14:])) if len(usage_list) >= 3 else 1.0

    periods: List[ForecastPeriod] = []
    cursor_date = last_date + timedelta(days=1)
    remaining = request.horizon_days
    # rolling window of predictions to feed next lags
    extended = list(usage_list)

    while remaining > 0:
        span = min(request.period_days, remaining)
        period_start = cursor_date
        period_end = cursor_date + timedelta(days=span - 1)

        period_total = 0.0
        period_variance = 0.0
        for offset in range(span):
            day_date = period_start + timedelta(days=offset)
            lags = _lags_from_series(extended)
            feats = {
                "facility_id": float(request.facility_id),
                "vaccine_id": float(request.vaccine_id),
                "day_of_week": float(day_date.weekday()),
                "month": float(day_date.month),
                "is_weekend": 1.0 if day_date.weekday() >= 5 else 0.0,
                **lags,
            }
            pred = xgb_model.predict_one(feats)
            if pred is None:
                return None
            period_total += pred
            period_variance += residual_std**2
            extended.append(pred)

        margin = _Z * (period_variance**0.5)
        predicted_quantity = int(round(period_total))
        periods.append(
            ForecastPeriod(
                forecast_period_start=period_start,
                forecast_period_end=period_end,
                predicted_quantity=predicted_quantity,
                confidence_level=confidence_level,
                lower_bound=max(0, int(round(period_total - margin))),
                upper_bound=int(round(period_total + margin)),
            )
        )
        cursor_date = period_end + timedelta(days=1)
        remaining -= span

    return ForecastResponse(
        vaccine_id=request.vaccine_id,
        facility_id=request.facility_id,
        model_version=xgb_model.model_version(),
        forecasts=periods,
    )


# ---------------------------------------------------------------------------
# Public entry
# ---------------------------------------------------------------------------

def forecast_demand(request: ForecastRequest) -> ForecastResponse:
    """Ưu tiên XGBoost; thiếu model / data mỏng → linear trend."""
    xgb_result = _forecast_xgboost(request)
    if xgb_result is not None:
        return xgb_result
    return _forecast_linear(request)
