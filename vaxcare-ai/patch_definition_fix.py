from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CLIENT = ROOT / "app" / "chatbot" / "llm" / "client.py"
FAQ = ROOT / "app" / "chatbot" / "handlers" / "faq_vaccine.py"

HELPERS = r'''
def _is_definition_question(text: str) -> bool:
    """Hỏi phòng bệnh gì / dùng để làm gì / tác dụng / công dụng."""
    t = (text or "").lower()
    return bool(
        re.search(
            r"(phòng\s*(bệnh\s*)?gì|phòng\s*những\s*(gì|bệnh)|"
            r"dùng\s*để\s*(làm\s*)?gì|công\s*dụng|tác\s*dụng|"
            r"là\s*gì|hiệu\s*quả|phòng\s*type|phòng\s*chủng|"
            r"chủng\s*nào|phòng\s*những\s*chủng)",
            t,
        )
    )


def _parse_vaccine_card(text: str) -> dict[str, str]:
    """Tách trường từ chunk dạng card vaccine."""
    out: dict[str, str] = {}
    if not text:
        return out
    patterns = {
        "name": r"(?:^|\n)\s*Vaccine\s*:\s*(.+)",
        "manufacturer": r"(?:^|\n)\s*Nhà\s*sản\s*xuất\s*:\s*(.+)",
        "disease": r"(?:^|\n)\s*Phòng\s*bệnh\s*:\s*(.+)",
        "doses": r"(?:^|\n)\s*Số\s*mũi\s*:\s*(.+)",
        "interval": r"(?:^|\n)\s*Khoảng\s*cách\s*\(?ngày\)?\s*:\s*(.+)",
        "description": r"(?:^|\n)\s*Mô\s*tả\s*:\s*(.+)",
    }
    for key, pat in patterns.items():
        m = re.search(pat, text, re.I)
        if m:
            val = (m.group(1) or "").strip()
            if key == "description":
                m2 = re.search(
                    r"(?:^|\n)\s*Mô\s*tả\s*:\s*(.+?)(?=\n\s*(?:Vaccine|Nhà sản xuất|Phòng bệnh|Số mũi|Khoảng cách)\s*:|\Z)",
                    text,
                    re.I | re.S,
                )
                if m2:
                    val = re.sub(r"\s+", " ", m2.group(1)).strip()
            if val and val.lower() not in ("none", "null", "n/a", "-"):
                out[key] = val
    return out


def _format_definition_from_card(
    card: dict[str, str], vlabel: str | None = None
) -> str | None:
    disease = card.get("disease")
    desc = card.get("description")
    name = card.get("name") or vlabel or "Vaccine này"
    if not disease and not desc:
        return None
    lines: list[str] = []
    if disease:
        lines.append(f"{name} dùng để phòng: {disease}.")
    if desc:
        if not disease or disease.lower() not in desc.lower()[:80]:
            lines.append(desc)
        elif not lines:
            lines.append(desc)
    if card.get("doses") and card["doses"].strip() not in ("1", "None"):
        lines.append(f"Số mũi tham khảo: {card['doses']}.")
    lines.append(
        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế / cơ sở tiêm chủng trước khi quyết định."
    )
    return "\n".join(lines)


_CARD_BY_VID: dict | None = None


def _load_vaccine_cards() -> dict:
    global _CARD_BY_VID
    if _CARD_BY_VID is not None:
        return _CARD_BY_VID
    out: dict = {}
    try:
        from pathlib import Path as _P
        import json as _json

        root = _P(__file__).resolve().parents[3]
        path = root / "knowledge" / "chunks" / "chunks.jsonl"
        if path.exists():
            with path.open(encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = _json.loads(line)
                    except Exception:
                        continue
                    text = obj.get("text") or ""
                    if "Phòng bệnh:" not in text and "Phòng bệnh :" not in text:
                        continue
                    card = _parse_vaccine_card(text)
                    if not card.get("disease") and not card.get("description"):
                        continue
                    for vid in obj.get("vaccine_ids") or []:
                        try:
                            out[int(vid)] = card
                        except (TypeError, ValueError):
                            pass
    except Exception as e:
        logger.warning("load vaccine cards failed: %s", e)
    _CARD_BY_VID = out
    return out


def _card_for_vaccine(vid, vax_names=None) -> dict:
    cards = _load_vaccine_cards()
    if vid is not None and int(vid) in cards:
        return cards[int(vid)]
    if vax_names:
        for name in vax_names:
            key = (name or "").strip().lower()
            if not key:
                continue
            for card in cards.values():
                n = (card.get("name") or "").lower()
                if key in n or n in key:
                    return card
    return {}

'''

EARLY_BLOCK = r'''
    # --- PATCH: definition early-return (tránh dump "Khoảng cách (ngày)") ---
    if (subtype == "definition" or _is_definition_question(msg)) and (
        vid is not None or vax_names
    ):
        card = _card_for_vaccine(vid, vax_names)
        if card:
            vlabel = (vax_names[0] if vax_names else None) or card.get("name")
            def_reply = _format_definition_from_card(card, vlabel)
            if def_reply:
                actions_early = []
                if vid:
                    actions_early.append(
                        Action(
                            type="OPEN_VACCINE",
                            label="Xem chi tiết vaccine",
                            vaccine_id=vid,
                            path=f"/vaccines/{vid}",
                        )
                    )
                actions_early.append(
                    Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
                )
                try:
                    get_memory_store().update_soft_context(
                        session_id,
                        {
                            "vaccine_ids": [vid] if vid is not None else [],
                            "vaccines": entities.get("vaccines") or [],
                        },
                    )
                except Exception:
                    pass
                return ChatResponse(
                    reply=def_reply,
                    intent="faq_vaccine",
                    intent_confidence=conf,
                    sources=[
                        Source(
                            doc_id="db-vaccine",
                            title=card.get("name") or "Thông tin vaccine",
                            tier="B",
                            issuer="VaxCare",
                        )
                    ],
                    actions=actions_early,
                    session_id=session_id,
                    meta={
                        "handler": "faq_vaccine",
                        "subtype": "definition",
                        "vaccine_id": vid,
                        "from_structured_card": True,
                        "early_return": True,
                        "followup_vaccines": vax_names,
                    },
                )
'''

MOCK_FN = r'''
    def _mock_generate(self, messages: list[dict[str, str]]) -> str:
        """Deterministic fallback khi chưa có model / backend lỗi và backend=mock."""
        import re as _re
        user = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user = m.get("content") or ""
                break

        q_part = ""
        if "Câu hỏi hiện tại" in user:
            q_part = user[user.rfind("Câu hỏi hiện tại") :][:200].lower()
        is_def_q = bool(
            _re.search(
                r"(phòng\s*(bệnh\s*)?gì|dùng\s*để|công\s*dụng|tác\s*dụng|"
                r"là\s*gì|chủng\s*nào|phòng\s*những)",
                q_part or user[:300].lower(),
            )
        )
        if is_def_q:
            disease_lines = []
            for line in user.splitlines():
                ls = line.strip()
                if _re.match(r"^(Phòng\s*bệnh|Mô\s*tả|Vaccine)\s*:", ls, _re.I):
                    disease_lines.append(ls)
            if disease_lines:
                name = disease = desc = ""
                for ls in disease_lines:
                    if _re.match(r"^Vaccine\s*:", ls, _re.I) and not name:
                        name = _re.sub(r"^Vaccine\s*:\s*", "", ls, flags=_re.I).strip()
                    elif _re.match(r"^Phòng\s*bệnh\s*:", ls, _re.I) and not disease:
                        disease = _re.sub(r"^Phòng\s*bệnh\s*:\s*", "", ls, flags=_re.I).strip()
                    elif _re.match(r"^Mô\s*tả\s*:", ls, _re.I) and not desc:
                        desc = _re.sub(r"^Mô\s*tả\s*:\s*", "", ls, flags=_re.I).strip()
                parts = []
                label = name or "Vaccine này"
                if disease:
                    parts.append(f"{label} dùng để phòng: {disease}.")
                if desc:
                    parts.append(desc)
                if parts:
                    parts.append(
                        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế "
                        "trước khi quyết định."
                    )
                    return "\n".join(parts)

        snippet = ""
        for key in (
            "Kết quả rule engine:",
            "Kết quả đối chiếu hồ sơ:",
            "Ngữ cảnh truy xuất:",
            "Kết quả sàng lọc sơ bộ:",
        ):
            if key in user:
                start = user.find(key)
                snippet = user[start : start + 600]
                break
        if not snippet:
            snippet = user[:400]

        lines = [ln for ln in snippet.splitlines() if ln.strip()]
        filtered = [
            ln for ln in lines
            if not _re.match(r"^\s*Khoảng\s*cách\s*\(?ngày\)?\s*:", ln, _re.I)
        ]
        if filtered:
            snippet = "\n".join(filtered[:12])

        return (
            "Dựa trên thông tin hiện có:\n"
            f"{snippet.strip()}\n\n"
            "Nội dung mang tính tham khảo theo lịch và tài liệu đã nạp. "
            "Vui lòng xác nhận lại với nhân viên y tế / cơ sở tiêm chủng trước khi quyết định."
        )
'''


def patch_client() -> None:
    if not CLIENT.exists():
        print("FAIL: không thấy", CLIENT)
        sys.exit(1)
    text = CLIENT.read_text(encoding="utf-8")
    if "is_def_q" in text and "Khoảng cách" in text and "disease_lines" in text:
        print("OK client.py: đã có patch mock definition")
        return
    # đảm bảo import re
    if not re.search(r"^import re\s*$", text, re.M):
        text = text.replace("import logging\n", "import logging\nimport re\n", 1)
    new, n = re.subn(
        r"    def _mock_generate\(self, messages: list\[dict\[str, str\]\]\) -> str:.*?(?=\n    def |\nclass |\Z)",
        MOCK_FN.lstrip("\n") + "\n",
        text,
        count=1,
        flags=re.S,
    )
    if n != 1:
        print("FAIL client.py: không thay được _mock_generate (pattern không khớp)")
        sys.exit(1)
    CLIENT.write_text(new, encoding="utf-8")
    print("OK client.py: đã vá _mock_generate")


def patch_faq() -> None:
    if not FAQ.exists():
        print("FAIL: không thấy", FAQ)
        sys.exit(1)
    text = FAQ.read_text(encoding="utf-8")
    if "from_structured_card" in text and "_card_for_vaccine" in text:
        print("OK faq_vaccine.py: đã có early-return definition")
        return

    # Chèn helpers trước def handle_faq_vaccine
    if "_is_definition_question" not in text:
        m = re.search(r"\ndef handle_faq_vaccine\(", text)
        if not m:
            print("FAIL faq_vaccine.py: không tìm thấy handle_faq_vaccine")
            sys.exit(1)
        text = text[: m.start()] + "\n" + HELPERS + "\n" + text[m.start() :]
        print("OK faq_vaccine.py: đã chèn helpers")

    # Chèn early block sau soft = dict(...)
    if "from_structured_card" not in text:
        pat = r"(mem = get_memory_store\(\)\.get\(session_id\)\s*\n\s*soft = dict\(mem\.soft_context or \{\}\)\s*\n)"
        m = re.search(pat, text)
        if not m:
            print("FAIL faq_vaccine.py: không tìm thấy vị trí soft_context để chèn early-return")
            sys.exit(1)
        text = text[: m.end()] + EARLY_BLOCK + text[m.end() :]
        print("OK faq_vaccine.py: đã chèn early-return")

    FAQ.write_text(text, encoding="utf-8")
    print("OK faq_vaccine.py: đã lưu")


def main() -> None:
    print("ROOT =", ROOT)
    patch_client()
    patch_faq()
    print()
    print("Xong. Tiếp theo trong CMD:")
    print(r"  cd /d D:\TTTN-VaxCare-2026\vaxcare-ai")
    print(r"  for /d /r %d in (__pycache__) do @if exist \"%d\" rd /s /q \"%d\"")
    print(r"  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print()
    print('Test JSON: {"message":"Vaccine HPV phòng bệnh gì?","session_id":"patch-test-1"}')
    print('Trong response.meta phải có: "from_structured_card": true')


if __name__ == "__main__":
    main()
