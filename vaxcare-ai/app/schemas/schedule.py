from __future__ import annotations

from datetime import date, time
from typing import List, Optional

from pydantic import BaseModel, Field


class SlotBooking(BaseModel):
    time_slot: time
    booked_count: int = Field(..., ge=0)


class HistoricalSlotStat(BaseModel):
    time_slot: time
    day_of_week: int = Field(..., ge=0, le=6, description="0=Mon ... 6=Sun")
    avg_bookings: float = Field(..., ge=0)


class ScheduleRequest(BaseModel):
    facility_id: int
    prediction_date: date
    capacity_per_slot: int = Field(..., gt=0)
    opening_time: time = time(8, 0)
    closing_time: time = time(17, 0)
    slot_duration_minutes: int = Field(60, gt=0, le=180)
    current_bookings: List[SlotBooking] = Field(default_factory=list)
    historical_stats: List[HistoricalSlotStat] = Field(default_factory=list)
    is_holiday: int = Field(0, ge=0, le=1)


class RankedSlot(BaseModel):
    time_slot: time
    predicted_bookings: int
    capacity: int
    occupancy_rate: float
    estimated_wait_minutes: int
    overload_probability: float
    recommended: bool
    rank: int = Field(..., description="1 = ít chờ nhất")


class ScheduleResponse(BaseModel):
    facility_id: int
    prediction_date: date
    slots: List[RankedSlot]
    recommended_slots: List[time]
    most_overloaded_slot: Optional[time] = None
    model_version: str
