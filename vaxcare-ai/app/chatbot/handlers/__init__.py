from app.chatbot.handlers.faq_vaccine import handle_faq_vaccine
from app.chatbot.handlers.schedule_advice import handle_schedule_advice
from app.chatbot.handlers.history_lookup import handle_history_lookup
from app.chatbot.handlers.vaxcare_lookup import handle_vaxcare_lookup
from app.chatbot.handlers.fallback import (
    handle_chitchat,
    handle_out_of_scope,
    handle_unknown,
)

__all__ = [
    "handle_faq_vaccine",
    "handle_schedule_advice",
    "handle_history_lookup",
    "handle_vaxcare_lookup",
    "handle_chitchat",
    "handle_out_of_scope",
    "handle_unknown",
]
