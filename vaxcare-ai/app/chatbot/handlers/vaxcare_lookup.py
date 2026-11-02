from __future__ import annotations

from typing import Any

from app.chatbot.entities import EntityExtractor
from app.schemas.chat import Action, ChatResponse


def handle_vaxcare_lookup(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
) -> ChatResponse:
    entities = entities or EntityExtractor().extract(message)
    vaccines = entities.get("vaccines") or []
    vid = None
    vname = None
    if vaccines:
        vid = vaccines[0].get("vaccine_id")
        vname = vaccines[0].get("name") or vaccines[0].get("matched")

    actions: list[Action] = []
    if vid:
        actions.append(
            Action(
                type="OPEN_VACCINE",
                label=f"Chi tiết {vname or 'vaccine'}",
                vaccine_id=vid,
                path=f"/vaccines/{vid}",
            )
        )
    actions.append(
        Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
    )
    actions.append(
        Action(type="OPEN_FACILITY", label="Tìm cơ sở tiêm", path="/facilities")
    )

    if vname or vid:
        reply = (
            f"Bạn đang quan tâm «{vname or 'vaccine'}». "
            "Bạn có thể xem trang chi tiết vaccine, tra cứu cơ sở tiêm gần bạn "
            "và chuyển sang đặt lịch ngay trên VaxCare."
        )
    else:
        reply = (
            "Bạn muốn tìm vaccine, cơ sở tiêm hay đặt lịch? "
            "Cho mình tên vaccine hoặc khu vực để mình dẫn đúng trang trên VaxCare. "
            "Bạn cũng có thể mở mục Đặt lịch / Cơ sở tiêm trực tiếp."
        )

    return ChatResponse(
        reply=reply,
        intent="vaxcare_lookup",
        intent_confidence=conf,
        actions=actions,
        session_id=session_id,
        meta={"handler": "vaxcare_lookup", "vaccine_id": vid},
    )
