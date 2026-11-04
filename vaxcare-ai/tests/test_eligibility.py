from __future__ import annotations

from app.chatbot.rules.eligibility import (
    check_eligibility_from_text,
    format_eligibility_text,
)


def test_defer_fever():
    r = check_eligibility_from_text("Bé đang sốt 39 độ có tiêm được không?")
    assert r.status == "defer_suggested"
    assert r.needs_clinician is True
    text = format_eligibility_text(r)
    assert "tạm hoãn" in text.lower() or "sàng lọc" in text.lower()


def test_caution_pregnancy():
    r = check_eligibility_from_text("Tôi đang mang thai tháng thứ 4, tiêm được HPV không?")
    assert r.status in ("caution", "defer_suggested")
    assert r.needs_clinician is True


def test_ok_generic():
    r = check_eligibility_from_text("Vaccine viêm gan B phòng bệnh gì?")
    assert r.status == "ok_to_discuss"
    assert r.needs_clinician is False


def test_faq_handler_includes_eligibility_meta():
    from app.chatbot.handlers.faq_vaccine import handle_faq_vaccine

    resp = handle_faq_vaccine(
        "Tôi đang sốt và muốn hỏi vaccine cúm",
        session_id="t1",
        conf=0.9,
    )
    assert resp.meta.get("eligibility", {}).get("status") == "defer_suggested"
    assert resp.safe_mode is True
