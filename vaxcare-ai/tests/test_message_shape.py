from app.chatbot.message_shape import has_substantive_question, is_pure_age_statement


def test_pure_age():
    assert is_pure_age_statement("mình 18 tuổi") is True
    assert is_pure_age_statement("Bé nhà mình 2 tuổi") is True


def test_age_plus_question_not_pure():
    assert is_pure_age_statement(
        "Bé 18 tháng, DTP mũi 4 là sao, khác mũi 1 2 chỗ nào"
    ) is False
    assert has_substantive_question(
        "Bé 18 tháng, DTP mũi 4 là sao, khác mũi 1 2 chỗ nào"
    ) is True


def test_hpv_not_pure_age():
    assert is_pure_age_statement("HPV tiêm được không, mình chưa tiêm bao giờ") is False
