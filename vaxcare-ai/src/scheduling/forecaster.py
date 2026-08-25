from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Dict, List, Tuple

from src.api.schemas import DispatchRequest, HistoricalSlotStat, SlotBooking

_CURRENT_WEIGHT = 0.6
_HISTORICAL_WEIGHT = 0.4


def build_day_slots(
    opening_time: time, closing_time: time, slot_duration_minutes: int
) -> List[time]:
    slots: List[time] = []
    cursor = datetime.combine(date.today(), opening_time)
    end = datetime.combine(date.today(), closing_time)
    step = timedelta(minutes=slot_duration_minutes)
    while cursor < end:
        slots.append(cursor.time())
        cursor += step
    return slots


def predict_bookings_per_slot(request: DispatchRequest) -> Dict[time, int]:
    day_of_week = request.prediction_date.weekday()  # 0=Thứ Hai ... 6=Chủ Nhật

    current_by_slot: Dict[time, int] = {
        b.time_slot: b.booked_count for b in request.current_bookings
    }
    historical_by_slot: Dict[time, float] = {
        h.time_slot: h.avg_bookings
        for h in request.historical_stats
        if h.day_of_week == day_of_week
    }

    all_slots = build_day_slots(
        request.opening_time, request.closing_time, request.slot_duration_minutes
    )

    predictions: Dict[time, int] = {}
    for slot in all_slots:
        current = current_by_slot.get(slot, 0)
        historical = historical_by_slot.get(slot)

        if historical is None:
            predicted = current
        else:
            blended = _CURRENT_WEIGHT * current + _HISTORICAL_WEIGHT * historical
            # Không bao giờ dự đoán thấp hơn số đã đặt thật.
            predicted = max(current, round(blended))

        predictions[slot] = int(predicted)

    return predictions
