from typing import Any, Literal

from pydantic import BaseModel, Field


class Source(BaseModel):
    doc_id: str
    title: str
    issuer: str | None = None
    tier: str | None = None
    url: str | None = None
    snippet: str | None = None


class Action(BaseModel):
    type: Literal[
        "OPEN_VACCINE",
        "OPEN_FACILITY",
        "OPEN_BOOKING",
        "OPEN_HISTORY",
        "NONE",
    ] = "NONE"
    label: str | None = None
    vaccine_id: int | None = None
    facility_id: int | None = None
    path: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str | None = None
    user_id: int | None = None
    context: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    reply: str
    intent: str
    intent_confidence: float = 0.0
    sources: list[Source] = Field(default_factory=list)
    actions: list[Action] = Field(default_factory=list)
    session_id: str | None = None
    safe_mode: bool = False
    meta: dict[str, Any] = Field(default_factory=dict)
