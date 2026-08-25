from __future__ import annotations

from datetime import date, timedelta
from typing import List

import numpy as np
import pandas as pd

from src.api.schemas import ForecastPeriod, ForecastRequest, ForecastResponse

MODEL_VERSION = "ai2-linear-trend-v1"

_MIN_POINTS_FOR_TREND = 3


def _to_daily_series(history: List) -> pd.Series:
    df = pd.DataFrame(
        {
            "date": [p.period_date for p in history],
            "quantity": [p.quantity for p in history],
        }
    )
    df = df.groupby("date", as_index=True)["quantity"].sum()
    full_index = pd.date_range(df.index.min(), df.index.max(), freq="D")
    daily = df.reindex(full_index, fill_value=0)
    return daily


def _fit_linear_trend(daily: pd.Series) -> tuple[float, float, float]:
    x = np.arange(len(daily), dtype=float)
    y = daily.values.astype(float)

    if len(daily) < _MIN_POINTS_FOR_TREND:
        mean = float(y.mean()) if len(y) else 0.0
        return 0.0, mean, float(y.std()) if len(y) else 0.0

    slope, intercept = np.polyfit(x, y, 1)
    predicted = slope * x + intercept
    residual_std = float(np.std(y - predicted))
    return float(slope), float(intercept), residual_std


def _day_of_week_factors(daily: pd.Series) -> dict[int, float]:
    overall_mean = float(daily.mean()) if len(daily) else 0.0
    if overall_mean <= 0:
        return {i: 1.0 for i in range(7)}

    factors: dict[int, float] = {}
    grouped = daily.groupby(daily.index.dayofweek).mean()
    for dow in range(7):
        factors[dow] = float(grouped.get(dow, overall_mean)) / overall_mean if overall_mean else 1.0
    return factors


def _confidence_level(num_points: int) -> float:
    """Càng nhiều dữ liệu lịch sử, độ tin cậy càng cao. Giới hạn [0.5, 0.95]."""
    level = 0.5 + min(num_points, 60) / 60 * 0.45
    return round(level, 2)


def forecast_demand(request: ForecastRequest) -> ForecastResponse:
    daily = _to_daily_series(request.history)
    slope, intercept, residual_std = _fit_linear_trend(daily)
    dow_factors = _day_of_week_factors(daily)

    last_x = len(daily) - 1
    last_date = daily.index[-1].date()
    confidence_level = _confidence_level(len(daily))
    # Khoảng tin cậy nới rộng dần theo bước dự báo xa (uncertainty tăng theo thời gian).
    z = 1.28  # ~80% khoảng tin cậy hai phía cho một baseline thống kê đơn giản

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

        margin = z * (period_variance**0.5)
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
        model_version=MODEL_VERSION,
        forecasts=periods,
    )
