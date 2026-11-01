from __future__ import annotations

import json
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def age_rules_df():
    from app.chatbot.rules.age_rules_loader import load_age_rules

    return load_age_rules(PROJECT_ROOT / "knowledge" / "rules" / "age_rules.csv")


@pytest.fixture(scope="module")
def mock_users():
    path = PROJECT_ROOT / "data" / "mock" / "mock_users.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def test_load_age_rules_has_required_columns(age_rules_df):
    required = {
        "rule_id",
        "age_group",
        "age_from_months",
        "age_to_months",
        "vaccine_id",
        "vaccine_short",
        "dose_number",
        "interval_days_min",
        "source_doc",
    }
    assert required.issubset(set(age_rules_df.columns))
    assert len(age_rules_df) >= 20


def test_rules_for_newborn(age_rules_df):
    from app.chatbot.rules.age_rules_loader import rules_for_age

    df = rules_for_age(0, age_rules_df)
    shorts = set(df["vaccine_short"].tolist())
    assert "BCG" in shorts
    assert "Viêm gan B" in shorts


def test_rules_for_14_months_includes_mmr(age_rules_df):
    from app.chatbot.rules.age_rules_loader import rules_for_age

    df = rules_for_age(14, age_rules_df)
    shorts = set(df["vaccine_short"].tolist())
    assert "MMR" in shorts or "Thủy đậu" in shorts


def test_mock_users_count(mock_users):
    assert len(mock_users) >= 10
    for u in mock_users:
        assert "user_id" in u
        assert "records" in u
        assert "age_months" in u


def test_missing_doses_for_user_without_mmr(mock_users, age_rules_df):
    """User 102 thiếu MMR / thủy đậu – expected có trong rule theo tuổi."""
    from app.chatbot.rules.age_rules_loader import expected_doses_by_vaccine

    user = next(u for u in mock_users if u["user_id"] == 102)
    exp = expected_doses_by_vaccine(user["age_months"], age_rules_df)
    have = {(r["vaccine_id"], r["dose_number"]) for r in user["records"]}

    missing = []
    for vid, doses in exp.items():
        for d in doses:
            key = (vid, int(d["dose_number"]))
            if key not in have:
                missing.append(d["vaccine_short"])

    assert len(missing) >= 1


def test_empty_history_user_has_many_missing(mock_users, age_rules_df):
    from app.chatbot.rules.age_rules_loader import expected_doses_by_vaccine

    user = next(u for u in mock_users if u["user_id"] == 109)
    assert user["records"] == []
    exp = expected_doses_by_vaccine(user["age_months"], age_rules_df)
    assert len(exp) >= 1


def test_adult_hpv_partial(mock_users, age_rules_df):
    """User 105 đã HPV mũi 1 – rule ≥15 tuổi còn mũi 2/3."""
    from app.chatbot.rules.age_rules_loader import expected_doses_by_vaccine

    user = next(u for u in mock_users if u["user_id"] == 105)
    exp = expected_doses_by_vaccine(user["age_months"], age_rules_df)
    have = {(r["vaccine_id"], r["dose_number"]) for r in user["records"]}
    # HPV id = 11
    hpv_expected = exp.get(11, [])
    if hpv_expected:
        missing_hpv = [
            d for d in hpv_expected if (11, int(d["dose_number"])) not in have
        ]
        assert len(missing_hpv) >= 1
