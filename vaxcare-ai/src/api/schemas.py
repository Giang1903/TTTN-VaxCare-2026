from __future__ import annotations

from datetime import date, time
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

class SlotBooking(BaseModel):
    time_slot: time = Field(..., description="Khung giờ, vd 08:00:00")
    booked_count: int = Field(..., ge=0, description="Số lịch hẹn đã đặt trong khung giờ này")


class HistoricalSlotStat(BaseModel):
    time_slot: time
    day_of_week: int = Field(..., ge=0, le=6, description="0=Thứ Hai ... 6=Chủ Nhật")
    avg_bookings: float = Field(..., ge=0)


class DispatchRequest(BaseModel):
    facility_id: int
    prediction_date: date
    capacity_per_slot: int = Field(..., gt=0)
    opening_time: time
    closing_time: time
    slot_duration_minutes: int = Field(30, gt=0, le=180)
    current_bookings: List[SlotBooking] = Field(default_factory=list)
    historical_stats: List[HistoricalSlotStat] = Field(default_factory=list)
    avg_service_minutes: float = Field(
        10.0, gt=0, description="Thời gian phục vụ trung bình / người, dùng để ước tính thời gian chờ"
    )

    @model_validator(mode="after")
    def _check_time_range(self) -> "DispatchRequest":
        if self.closing_time <= self.opening_time:
            raise ValueError("closing_time phải sau opening_time")
        return self


class SlotPrediction(BaseModel):
    time_slot: time
    predicted_bookings: int
    capacity: int
    overload_probability: float = Field(..., ge=0, le=1)
    estimated_wait_minutes: int
    recommended: bool = Field(..., description="True nếu đây là khung giờ vắng, nên gợi ý cho người dùng")


class DispatchResponse(BaseModel):
    facility_id: int
    prediction_date: date
    slots: List[SlotPrediction]
    recommended_slots: List[time] = Field(
        default_factory=list, description="Top khung giờ vắng nhất, gợi ý đặt lịch"
    )
    most_overloaded_slot: Optional[time] = None
    model_version: str = "ai1-rule-based-v1"

class ConsumptionPoint(BaseModel):
    """Một điểm dữ liệu tiêu thụ vắc xin lịch sử (theo ngày)."""

    period_date: date
    quantity: int = Field(..., ge=0)


class ForecastRequest(BaseModel):
    vaccine_id: int
    facility_id: int
    history: List[ConsumptionPoint] = Field(..., min_length=1)
    horizon_days: int = Field(14, gt=0, le=180)
    period_days: int = Field(7, gt=0, le=30, description="Độ rộng mỗi kỳ dự báo, mặc định theo tuần")

    @model_validator(mode="after")
    def _sort_history(self) -> "ForecastRequest":
        self.history = sorted(self.history, key=lambda p: p.period_date)
        return self


class ForecastPeriod(BaseModel):
    forecast_period_start: date
    forecast_period_end: date
    predicted_quantity: int
    confidence_level: float = Field(..., ge=0, le=1)
    lower_bound: int
    upper_bound: int


class ForecastResponse(BaseModel):
    vaccine_id: int
    facility_id: int
    model_version: str
    forecasts: List[ForecastPeriod]
