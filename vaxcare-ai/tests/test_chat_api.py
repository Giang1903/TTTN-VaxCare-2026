from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "UP"
    assert "modules" in data


def test_chat_chitchat():
    r = client.post(
        "/api/v1/chatbot/chat",
        json={"message": "Xin chào", "session_id": "t1"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["intent"] == "chitchat"
    assert data["reply"]
    assert "latency_ms" in data.get("meta", {})


def test_chat_emergency_safe_mode():
    r = client.post(
        "/api/v1/chatbot/chat",
        json={"message": "Tôi bị đau ngực khó thở sau tiêm", "session_id": "t2"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["safe_mode"] is True
    assert data["intent"] == "out_of_scope"


def test_chat_schedule_with_age():
    r = client.post(
        "/api/v1/chatbot/chat",
        json={
            "message": "Tôi 20 tuổi nên kiểm tra những vaccine nào?",
            "session_id": "t3",
            "context": {"age_years": 20, "age_months": 240},
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["intent"] == "schedule_advice"
    assert data["reply"]
