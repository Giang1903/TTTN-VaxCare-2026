from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class ConsumptionPoint(BaseModel):
    period_date: date
    quantity: int = Field(..., ge=0)


class ForecastRequest(BaseModel):
    vaccine_id: int
    facility_id: int
    history: List[ConsumptionPoint] = Field(default_factory=list)
    horizon_days: int = Field(28, ge=1, le=90, description="Số ngày dự báo phía trước")
    period_days: int = Field(7, ge=1, le=30, description="Độ dài mỗi bucket dự báo (thường = 7)")


class ForecastPeriod(BaseModel):
    forecast_period_start: date
    forecast_period_end: date
    predicted_quantity: int = Field(..., ge=0)
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    lower_bound: int = Field(..., ge=0)
    upper_bound: int = Field(..., ge=0)


class ForecastResponse(BaseModel):
    vaccine_id: int
    facility_id: int
    model_version: str
    forecasts: List[ForecastPeriod]
