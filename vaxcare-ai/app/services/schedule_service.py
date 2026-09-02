from __future__ import annotations

import math
from datetime import date, datetime, time, timedelta
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np

from app.core.config import settings
from app.schemas.schedule import (
    HistoricalSlotStat,
    RankedSlot,
    ScheduleRequest,
    ScheduleResponse,
    SlotBooking,
)

FEATURES = [
    "day_of_week",
    "is_weekend",
    "is_holiday",
    "hour",
    "capacity",
    "booked",
    "occupancy_rate",
]


@lru_cache(maxsize=1)
def _load_model():
    path = settings.model_dir / settings.schedule_model_name
    if not path.exists():
        return None
    return joblib.load(path)


def model_version() -> str:
    art = _load_model()
    if art:
        return art.get("model_version", "ai1-xgboost-v1")
    return "ai1-heuristic-fallback"


def _build_slots(opening: time, closing: time, duration_min: int) -> List[time]:
    slots: List[time] = []
    cur = datetime.combine(date.today(), opening)
    end = datetime.combine(date.today(), closing)
    step = timedelta(minutes=duration_min)
    while cur < end:
        slots.append(cur.time())
        cur += step
    return slots


def _predict_bookings(req: ScheduleRequest, slots: List[time]) -> Dict[time, int]:
    """Blend 60% current + 40% historical same weekday."""
    dow = req.prediction_date.weekday()
    current = {b.time_slot: b.booked_count for b in req.current_bookings}
    hist = {
        h.time_slot: h.avg_bookings
        for h in req.historical_stats
        if h.day_of_week == dow
    }
    out: Dict[time, int] = {}
    for slot in slots:
        c = current.get(slot, 0)
        h = hist.get(slot)
        if h is None:
            pred = c
        else:
            pred = max(c, round(0.6 * c + 0.4 * h))
        out[slot] = int(pred)
    return out


def _sigmoid_overload(booked: int, capacity: int) -> float:
    if capacity <= 0:
        return 1.0
    ratio = booked / capacity
    p = 1.0 / (1.0 + math.exp(-6.0 * (ratio - 0.8)))
    return round(min(1.0, max(0.0, p)), 4)


def _predict_wait(
    day_of_week: int,
    is_weekend: int,
    is_holiday: int,
    hour: int,
    capacity: int,
    booked: int,
) -> int:
    occupancy = booked / capacity if capacity > 0 else 1.0
    art = _load_model()
    if art is not None:
        model = art["model"]
        feats = art.get("features", FEATURES)
        row = {
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "hour": hour,
            "capacity": capacity,
            "booked": booked,
            "occupancy_rate": round(occupancy, 3),
        }
        X = np.array([[row[f] for f in feats]], dtype=float)
        return max(0, int(round(float(model.predict(X)[0]))))

    # heuristic fallback
    if occupancy < 0.35:
        return 8
    if occupancy < 0.65:
        return 20
    if occupancy < 0.85:
        return 38
    return 60


def rank_slots(req: ScheduleRequest) -> ScheduleResponse:
    slots = _build_slots(req.opening_time, req.closing_time, req.slot_duration_minutes)
    if not slots:
        return ScheduleResponse(
            facility_id=req.facility_id,
            prediction_date=req.prediction_date,
            slots=[],
            recommended_slots=[],
            model_version=model_version(),
        )

    predicted = _predict_bookings(req, slots)
    dow = req.prediction_date.weekday()
    is_weekend = 1 if dow >= 5 else 0
    is_holiday = req.is_holiday

    ranked: List[RankedSlot] = []
    for slot in slots:
        booked = predicted[slot]
        cap = req.capacity_per_slot
        occ = round(booked / cap, 3) if cap else 1.0
        wait = _predict_wait(dow, is_weekend, is_holiday, slot.hour, cap, booked)
        overload = _sigmoid_overload(booked, cap)
        ranked.append(
            RankedSlot(
                time_slot=slot,
                predicted_bookings=booked,
                capacity=cap,
                occupancy_rate=occ,
                estimated_wait_minutes=wait,
                overload_probability=overload,
                recommended=False,
                rank=0,
            )
        )

    # Xếp hạng: chờ ít → quá tải thấp → giờ sớm hơn (ổn định khi bằng nhau)
    ordered = sorted(
        ranked,
        key=lambda s: (s.estimated_wait_minutes, s.overload_probability, s.time_slot),
    )
    for i, s in enumerate(ordered, start=1):
        s.rank = i

    # Chỉ TOP N slot tốt nhất (và không quá tải nặng) mới được recommended.
    # Tránh mọi khung trống đều dính badge AI + gợi ý không khớp thời gian chờ.
    max_rec = settings.max_recommendations
    threshold = settings.recommend_overload_threshold
    eligible = [s for s in ordered if s.overload_probability < threshold]
    if not eligible and ordered:
        eligible = [ordered[0]]
    else:
        eligible = eligible[:max_rec]

    for s in eligible:
        s.recommended = True

    recommended = [s.time_slot for s in eligible]

    # response slots theo giờ trong ngày
    by_time = sorted(ordered, key=lambda s: s.time_slot)
    most_busy = max(ordered, key=lambda s: s.overload_probability).time_slot if ordered else None

    return ScheduleResponse(
        facility_id=req.facility_id,
        prediction_date=req.prediction_date,
        slots=by_time,
        recommended_slots=recommended,
        most_overloaded_slot=most_busy,
        model_version=model_version(),
    )