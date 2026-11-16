from __future__ import annotations

import pytest

from app.chatbot.faq_subtype import classify_faq_subtype, needs_age_slot
from app.chatbot.vaccine_meta import (
    format_mandatory_answer,
    format_post_vax_answer,
    get_meta,
    get_meta_by_name,
)


@pytest.mark.parametrize(
    "text,expected",
    [
        ("Cúm năm nào cũng tiêm à, có bắt buộc không", "mandatory"),
        ("Vaccine cúm có bắt buộc không?", "mandatory"),
        ("HPV tiêm được không, mình chưa tiêm bao giờ", "never_vaccinated"),
        ("Zona người trẻ có cần không hay chỉ người già", "indication"),
        ("Người nào tiêm 2 liều, người nào 3 liều?", "regimen"),
        ("Vậy là 3 liều cho người lớn phải không?", "confirm"),
        ("Vaccine HPV phòng bệnh gì?", "definition"),
        ("Sau mũi viêm gan B đầu phải chờ bao lâu mũi 2?", "interval"),
        ("Bé 2 tuổi nên tiêm gì?", "general"),  # schedule handled elsewhere
        ("Tiêm xong sốt thì sao, có sao không", "post_vax"),
        ("Sau tiêm bị sốt nhẹ phải làm gì?", "post_vax"),
        ("Phản ứng sau tiêm có nguy hiểm không?", "post_vax"),
        ("Cúm có phải tiêm mỗi năm không?", "mandatory"),
        ("HPV có bắt buộc không?", "mandatory"),
        ("Mình chưa tiêm sởi bao giờ thì sao?", "never_vaccinated"),
        ("Viêm gan B mũi 2 cách mũi 1 bao lâu?", "interval"),
        ("Tiêm xong bị sưng đau tại chỗ có sao không?", "post_vax"),
    ],
)
def test_classify_paraphrases(text, expected):
    assert classify_faq_subtype(text) == expected


def test_needs_age_personal_vs_general():
    assert needs_age_slot("never_vaccinated", "HPV tiêm được không, mình chưa tiêm") is True
    assert needs_age_slot("indication", "Zona người trẻ có cần không") is False


def test_flu_meta_annual_not_mandatory():
    m = get_meta(10) or get_meta_by_name("cúm")
    assert m is not None
    assert m["annual"] is True
    assert m["mandatory_tcmr"] is False
    ans = format_mandatory_answer(m, "cúm")
    assert "hàng năm" in ans.lower() or "mỗi năm" in ans.lower()
    assert "không phải mũi bắt buộc" in ans.lower() or "không phải" in ans.lower()


def test_shingrix_min_age():
    m = get_meta(13) or get_meta_by_name("zona")
    assert m is not None
    assert int(m["min_age_months"]) >= 600  # ~50y


def test_hpv_meta_service():
    m = get_meta(11)
    assert m is not None
    assert m["mandatory_tcmr"] is False


def test_post_vax_answer_has_red_flags():
    ans = format_post_vax_answer("Tiêm xong sốt thì sao, có sao không")
    low = ans.lower()
    assert "sốt" in low
    assert "khám" in low or "y tế" in low or "cấp cứu" in low
    assert "tham khảo" in low


def test_meta_hep_a_and_meningococcal():
    assert get_meta(16) is not None or get_meta_by_name("viêm gan a") is not None
    m = get_meta(16) or get_meta_by_name("viêm gan a")
    assert m["mandatory_tcmr"] is False
