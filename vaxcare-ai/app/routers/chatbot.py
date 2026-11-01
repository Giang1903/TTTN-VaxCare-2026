from fastapi import APIRouter, Depends

from app.chatbot.orchestrator import handle_chat
from app.core.security import verify_internal_api_key
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/v1/chatbot", tags=["Chatbot"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    _: None = Depends(verify_internal_api_key),
) -> ChatResponse:
    return handle_chat(body)
