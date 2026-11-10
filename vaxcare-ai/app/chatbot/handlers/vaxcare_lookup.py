from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

from app.chatbot.entities import EntityExtractor
from app.schemas.chat import Action, ChatResponse

logger = logging.getLogger(__name__)

_CATALOG_PATHS = [
    Path(__file__).resolve().parents[3] / "data" / "mock" / "vaccines_from_db.json",
]


def _load_catalog() -> list[dict[str, Any]]:
    for p in _CATALOG_PATHS:
        try:
            if p.exists():
                data = json.loads(p.read_text(encoding="utf-8"))
                if isinstance(data, list) and data:
                    return data
        except Exception as e:
            logger.warning("Cannot load vaccine catalog %s: %s", p, e)
    return []


def _catalog_names(limit: int = 20) -> list[str]:
    names = []
    for v in _load_catalog():
        n = v.get("short_name") or v.get("vaccine_name") or ""
        n = str(n).strip()
        if n:
            names.append(n)
        if len(names) >= limit:
            break
    return names


def handle_vaxcare_lookup(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
    history: list | None = None,
    **kwargs,
) -> ChatResponse:
    entities = entities or EntityExtractor().extract(message)
    vaccines = entities.get("vaccines") or []
    vid = None
    vname = None
    if vaccines:
        vid = vaccines[0].get("vaccine_id")
        vname = vaccines[0].get("name") or vaccines[0].get("matched")

    msg_l = (message or "").lower()

    if not vname:
        alias = [
            (r"\b(dại|rabies)\b", "vaccine phòng dại"),
            (r"\b(covid|sars-cov|ncov|covid-?19)\b", "vaccine COVID-19"),
            (r"\b(hpv|gardasil)\b", "vaccine HPV"),
            (r"\b(cúm|flu|influenza)\b", "vaccine cúm"),
            (r"\b(sởi|mmr)\b", "vaccine sởi/MMR"),
            (r"\b(bcg|bbg|lao)\b", "vaccine BCG (lao)"),
            (r"\b(viêm gan\s*b|hepb|hep-b)\b", "vaccine viêm gan B"),
            (r"\b(zona|shingrix)\b", "vaccine zona"),
            (r"\b(uốn ván|tdap|tt)\b", "vaccine uốn ván/Tdap"),
            (r"\b(phế cầu|prevenar|pcv)\b", "vaccine phế cầu"),
        ]
        for pat, name in alias:
            if re.search(pat, msg_l):
                vname = name
                break

    want_booking = any(
        k in msg_l
        for k in ("đặt lịch", "đăng ký tiêm", "booking", "hẹn tiêm", "mở đặt lịch")
    )
    want_facility = any(
        k in msg_l
        for k in ("cơ sở", "phòng khám", "gần đây", "ở đâu tiêm", "facility", "địa điểm")
    )
    want_list = bool(
        re.search(
            r"(có những (loại )?vaccin|có những (loại )?vaccine|có những vắc|"
            r"danh sách vaccine|danh mục vaccine|vaccine nào|vaccin nào|"
            r"tiêm được những gì|những vaccine (nào|gì)|vaccine đang có|"
            r"bên bạn có những)",
            msg_l,
        )
    )
    want_avail = (not want_list) and bool(
        re.search(
            r"((có|còn)\s*(vaccine|vaccin|vắc)|bên bạn có|bên mình có|đang còn)",
            msg_l,
        )
    )
    want_detail = any(
        k in msg_l for k in ("chi tiết", "trang vaccine", "thông tin vaccine", "mở trang")
    ) or bool(vid)

    actions: list[Action] = []
    if want_list:
        actions.append(
            Action(
                type="OPEN_VACCINE",
                label="Xem danh mục vaccine",
                path="/vaccines",
            )
        )
    elif vid or vname or want_detail:
        actions.append(
            Action(
                type="OPEN_VACCINE",
                label=f"Chi tiết {vname or 'vaccine'}",
                vaccine_id=vid,
                path=f"/vaccines/{vid}" if vid else "/vaccines",
            )
        )
    actions.append(
        Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
    )
    actions.append(
        Action(type="OPEN_FACILITY", label="Tìm cơ sở tiêm", path="/facilities")
    )

    if want_list:
        names = _catalog_names()
        if names:
            # Mỗi vaccine một hàng (danh sách có dấu •)
            bullets = "\n".join(f"• {n}" for n in names)
            reply = f"Danh mục vaccine trên hệ thống:\n{bullets}"
        else:
            reply = "Bạn mở mục Vaccine trên VaxCare để xem danh mục."
    elif want_avail:
        if vname or vid:
            reply = (
                f"Với **{vname or 'vaccine'}**, mình không theo dõi còn hàng realtime. "
                "Bạn kiểm tra trên VaxCare hoặc hỏi nhân viên tại cơ sở."
            )
        else:
            reply = (
                "Mình không nắm tồn kho realtime. "
                "Cho tên vaccine cụ thể, hoặc hỏi «có những vaccine gì?»."
            )
    elif vname or vid:
        if want_booking:
            reply = f"Bạn có thể đặt lịch tiêm **{vname or 'vaccine'}** trên VaxCare."
        elif want_facility:
            reply = f"Mở Tìm cơ sở tiêm trên VaxCare để xem nơi tiêm **{vname or 'vaccine'}**."
        else:
            reply = f"Bạn đang xem **{vname or 'vaccine'}**. Có thể mở trang chi tiết trên VaxCare."
    else:
        if want_booking:
            reply = "Bạn đặt lịch trên VaxCare được. Nói thêm tên vaccine nếu cần."
        elif want_facility:
            reply = "Mở mục Cơ sở tiêm trên VaxCare để xem cơ sở gần bạn."
        else:
            reply = "Bạn cần tìm vaccine, cơ sở hay đặt lịch? Nói tên vaccine cũng được."

    return ChatResponse(
        reply=reply,
        intent="vaxcare_lookup",
        intent_confidence=conf,
        actions=actions,
        session_id=session_id,
        meta={
            "handler": "vaxcare_lookup",
            "vaccine_id": vid,
            "vaccine_name": vname,
            "want_booking": want_booking,
            "want_facility": want_facility,
            "want_availability": want_avail,
            "want_list": want_list,
        },
    )
