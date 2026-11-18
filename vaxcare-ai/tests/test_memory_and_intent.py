
from __future__ import annotations

from app.chatbot.memory import MemoryStore, get_memory_store
from app.chatbot.orchestrator import handle_chat, _guess_intent
from app.schemas.chat import ChatRequest


def test_memory_soft_context_age():
    store = get_memory_store()
    sid = "test-mem-age-1"
    store.clear(sid)

    r1 = handle_chat(ChatRequest(message="Bé nhà mình 2 tuổi", session_id=sid))
    assert r1.session_id == sid
    soft = r1.meta.get("memory_soft") or {}
    assert soft.get("age_years") == 2.0 or soft.get("age_months") == 24.0

    r2 = handle_chat(ChatRequest(message="Nên tiêm những vaccine nào?", session_id=sid))
    soft2 = r2.meta.get("memory_soft") or {}
    assert soft2.get("age_years") == 2.0 or soft2.get("age_months") == 24.0
    assert (r2.meta.get("memory_turns") or 0) >= 2
    store.clear(sid)


def test_guess_intent_high_conf_cases():
    assert _guess_intent("Xin chào")[0] == "chitchat"
    assert _guess_intent("Vaccine HPV phòng bệnh gì?")[0] == "faq_vaccine"
    assert _guess_intent("Tôi bị đau ngực khó thở")[0] == "out_of_scope"
    assert _guess_intent("Lịch sử tiêm của tôi")[0] == "history_lookup"
