from __future__ import annotations

import asyncio
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, status

from app.chatbot.orchestrator import handle_chat
from app.core.config import settings
from app.core.security import verify_internal_api_key
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.model_loader import is_loaded

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chatbot", tags=["Chatbot"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    _: None = Depends(verify_internal_api_key),
) -> ChatResponse:
    if not settings.chatbot_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chatbot module is disabled",
        )

    if not is_loaded():
        logger.warning("Models not fully loaded yet – serving with degraded mode")

    timeout_sec = float(getattr(settings, "chat_timeout_sec", 30.0) or 30.0)
    t0 = time.perf_counter()

    try:
        resp = await asyncio.wait_for(
            asyncio.to_thread(handle_chat, body),
            timeout=timeout_sec,
        )
    except asyncio.TimeoutError:
        logger.error("Chat timeout after %.1fs message=%r", timeout_sec, body.message[:80])
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Chatbot timeout after {timeout_sec:.0f}s",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat handler error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chatbot internal error",
        )

    latency_ms = round((time.perf_counter() - t0) * 1000, 1)
    meta = dict(resp.meta or {})
    meta["latency_ms"] = latency_ms
    meta["models_loaded"] = is_loaded()
    resp.meta = meta

    logger.info(
        "chat intent=%s conf=%.2f safe=%s latency_ms=%.1f msg=%r",
        resp.intent,
        resp.intent_confidence,
        resp.safe_mode,
        latency_ms,
        (body.message or "")[:60],
    )
    return resp
