from __future__ import annotations

import logging
import re
from typing import Any

from app.chatbot.entities import EntityExtractor
from app.chatbot.llm.client import get_llm_client
from app.chatbot.llm.guardrails import enforce_guardrails
from app.chatbot.llm.prompts import build_messages
from app.chatbot.rules.eligibility import (
    check_eligibility_from_text,
    format_eligibility_text,
)
from app.schemas.chat import Action, ChatResponse, Source
from app.chatbot.faq_subtype import classify_faq_subtype, needs_age_slot
from app.chatbot.message_shape import has_substantive_question
from app.chatbot.memory import get_memory_store

logger = logging.getLogger(__name__)

_DISEASE_Q = re.compile(
    r"(nguyên\s*nhân|lý\s*do\s*(mắc|bệnh)|vì\s*sao\s*(mắc|bị|nhiễm)|"
    r"đường\s*lây|lây\s*qua|triệu\s*chứng|biểu\s*hiện|"
    r"mắc\s*bệnh\s*(do|vì)|bị\s*nhiễm\s*(do|vì)|"
    r"cause\s+of|why\s+(do\s+people\s+)?get|transmission|symptom)",
    re.I,
)

_VACCINE_CONTEXT = re.compile(
    r"(tiêm|vắc\s*xin|vaccine|liều|mũi|chống\s*chỉ\s*định|"
    r"chỉ\s*định|phác\s*đồ|lịch\s*tiêm|tcmr|hd\s*sd)",
    re.I,
)
_ETIOLOGY_CONTEXT = re.compile(
    r"(nguyên\s*nhân|đường\s*lây|lây\s*truyền|virus|vi\s*khuẩn|"
    r"triệu\s*chứng|cơ\s*chế|nhiễm\s*trùng|pathogen|transmission|etiology)",
    re.I,
)


def _disease_examples(message: str) -> str:
    """Gợi ý câu hỏi vaccine khớp bệnh user đang hỏi (không luôn COVID)."""
    t = (message or "").lower()
    pairs = [
        (("dại", "rabies"), "Vaccine dại phòng bệnh gì?", "Ai nên tiêm vaccine dại?"),
        (("phế cầu", "pneumo", "prevenar", "pcv"), "Vaccine phế cầu phòng bệnh gì?", "Lịch tiêm phế cầu thế nào?"),
        (("sởi", "mmr", "quai bị", "rubella"), "Vaccine MMR phòng bệnh gì?", "Phác đồ MMR như thế nào?"),
        (("covid", "sars-cov", "ncov"), "Vaccine COVID phòng bệnh gì?", "Ai nên tiêm vaccine COVID?"),
        (("hpv",), "Vaccine HPV phòng bệnh gì?", "Ai nên tiêm HPV?"),
        (("cúm", "flu"), "Vaccine cúm phòng bệnh gì?", "Khi nào nên tiêm cúm?"),
        (("viêm gan", "hep"), "Vaccine viêm gan B phòng bệnh gì?", "Phác đồ viêm gan B?"),
        (("bcg", "bbg", "lao"), "Vaccine BCG phòng bệnh gì?", "Khi nào tiêm BCG?"),
    ]
    for keys, e1, e2 in pairs:
        if any(k in t for k in keys):
            return f"- {e1}\n- {e2}"
    return "- Vaccine phòng bệnh gì?\n- Tiêm mấy mũi / ai nên tiêm?"


def _is_protocol_question(text: str) -> bool:
    t = (text or "").lower()
    return bool(
        re.search(
            r"(phác\s*đồ|lịch\s*tiêm|bao nhiêu\s*mũi|mấy\s*mũi|tiêm\s*bao nhiêu|"
            r"cần\s*tiêm\s*(mấy|bao nhiêu)|liều\s*trình|mấy\s*liều|bao nhiêu\s*liều|"
            r"khoảng\s*cách.*mũi|tiêm\s*vào\s*lúc\s*nào|schedule|tiêm\s*như\s*nào|"
            r"ai (nên|phải) tiêm|người nào (nên|phải) tiêm|đối tượng tiêm|"
            r"2\s*liều|3\s*liều|hai\s*liều|ba\s*liều)",
            t,
        )
    )


def _stated_completed_dose(text: str) -> int | None:
    """User nói đã tiêm mũi N → trả về N."""
    t = (text or "").lower()
    m = re.search(r"(?:đã\s*tiêm|tiêm\s*xong|xong)\s*(?:mũi|liều)\s*(\d+)", t)
    if m:
        return int(m.group(1))
    m = re.search(r"(?:mũi|liều)\s*(\d+)\s*(?:rồi|xong)", t)
    if m:
        return int(m.group(1))
    return None


def _asks_next_dose(text: str) -> bool:
    t = (text or "").lower()
    return bool(
        re.search(
            r"(mũi\s*\d+|mũi\s*tiếp|bao\s*lâu|khi\s*nào\s*tiêm|cách\s*bao\s*lâu|"
            r"bao\s*lâu\s*nữa|tiêm\s*tiếp)",
            t,
        )
    )



def _is_confirm_followup(text: str) -> bool:
    """Câu xác nhận ý vừa nói — KHÔNG gồm 'tiêm được không' / hỏi chỉ định."""
    t = (text or "").strip().lower()
    if not t or len(t) > 140:
        return False
    # Câu hỏi khả năng / chỉ định / chưa tiêm → không phải confirm
    if re.search(
        r"(tiêm được không|có tiêm được|nên tiêm không|có cần tiêm|"
        r"chưa tiêm|chưa từng|người trẻ|người già|bao nhiêu tuổi|"
        r"ai nên|đối tượng|có cần không)",
        t,
    ):
        return False
    return bool(
        re.search(
            r"(phải không|đúng không|có phải không|phải ko|đúng ko|"
            r"phải vậy không|đúng vậy không|có đúng không|"
            r"đúng chứ|đúng nhỉ|phải chứ|đúng hả|phải hả|"
            r"vậy hả|thế hả|vậy à|thế à|vậy ư|đúng ư|"
            r"ý (bạn|mày|em) là|\bý là\b|\btức là\b|\bnghĩa là\b|"
            r"^(vậy là|thế là)\b|"
            r"confirm|is that (right|correct))",
            t,
        )
    )


def _is_can_i_vaccinate_question(text: str) -> bool:
    """Hỏi có tiêm được không / chưa tiêm bao giờ / có cần không."""
    t = (text or "").lower()
    return bool(
        re.search(
            r"(tiêm được không|có tiêm được|nên tiêm không|có nên tiêm|"
            r"chưa tiêm( bao giờ| lần nào)?|chưa từng tiêm|"
            r"có cần (tiêm|không)|cần tiêm không|"
            r"người trẻ.*có cần|chỉ (người già|người lớn tuổi)|"
            r"bao nhiêu tuổi trở lên|từ mấy tuổi)",
            t,
        )
    )


def _indication_answer_from_rows(rows: list[dict], vlabel: str, question: str) -> str:
    """Trả lời chỉ định / ai nên tiêm dựa trên age_group + note, không dump mũi."""
    ages: list[str] = []
    notes: list[str] = []
    sources: list[str] = []
    for r in rows:
        age_g = (r.get("age_group") or "").strip()
        note = (r.get("note") or "").strip()
        if age_g and age_g not in ages:
            ages.append(age_g)
        if note and note not in notes and len(note) < 120:
            notes.append(note)
        src = (r.get("source_doc") or "").strip()
        if src and src not in sources:
            sources.append(src)

    q = (question or "").lower()
    lines: list[str] = []

    age_join = ", ".join(ages[:4]) if ages else ""
    # Chưa tiêm bao giờ
    if re.search(r"chưa tiêm|chưa từng", q):
        lines.append(
            f"Nếu chưa tiêm {vlabel} bao giờ, vẫn có thể bắt đầu phác đồ khi thuộc đúng nhóm tuổi / chỉ định."
        )
        if age_join:
            lines.append(f"Nhóm tuổi thường được khuyến cáo trong tài liệu: {age_join}.")
        lines.append(
            "Cần thêm độ tuổi (và tình trạng sức khỏe liên quan) để nói cụ thể hơn; "
            "khám sàng lọc tại cơ sở trước khi tiêm."
        )
    elif re.search(r"người trẻ|người già|chỉ.*già|có cần không", q):
        lines.append(f"Về {vlabel}:")
        if age_join:
            lines.append(f"- Chỉ định / nhóm tuổi trong tài liệu tham khảo: {age_join}.")
        # Heuristic zona / shingrix
        blob = " ".join(ages + notes).lower()
        if "50" in blob or "≥50" in blob or ">=50" in blob:
            lines.append(
                "- Thường khuyến cáo người từ khoảng 50 tuổi trở lên; "
                "người trẻ khỏe mạnh thường không nằm nhóm ưu tiên thường quy."
            )
        elif notes:
            lines.append("- " + notes[0])
        lines.append(
            "Không thay thế tư vấn bác sĩ — tùy bệnh nền và nguy cơ cá nhân."
        )
    else:
        # tiêm được không (chung)
        lines.append(
            f"Có thể xem xét tiêm {vlabel} nếu thuộc đúng nhóm tuổi / chỉ định và không có chống chỉ định khi sàng lọc."
        )
        if age_join:
            lines.append(f"Nhóm tuổi thường gặp trong tài liệu: {age_join}.")
        lines.append(
            "Bạn cho thêm độ tuổi sẽ rõ hơn; quyết định cuối tại cơ sở tiêm chủng."
        )

    if sources:
        lines.append("Nguồn: " + ", ".join(sources[:3]) + ".")
    return "\n".join(lines)




def _short_protocol_summary(
    rows: list[dict],
    vlabel: str,
    question: str = "",
    *,
    is_confirm: bool = False,
) -> str:
    """
    Tóm tắt ngắn theo *phác đồ N liều / nhóm tuổi*, không liệt kê từng mũi 1-2-3.
    """
    if not rows:
        return ""

    sources: list[str] = []
    # Gom gợi ý phác đồ từ note + age_group
    # Ví dụ note: "HPV ưu tiên 9–14 tuổi phác đồ 2 liều" / "Từ 15 tuổi thường 3 liều"
    regimen: dict[int, list[str]] = {}  # N liều -> list mô tả nhóm
    flat_parts: list[str] = []

    for r in rows:
        age_g = (r.get("age_group") or "").strip()
        note = (r.get("note") or "").strip()
        text = f"{age_g} {note}".strip()
        if text:
            flat_parts.append(text)
        src = (r.get("source_doc") or "").strip()
        if src and src not in sources:
            sources.append(src)

        # Bắt "phác đồ 2 liều" / "thường 3 liều" / "2 liều" trong note
        n_match = re.findall(
            r"(?:phác\s*đồ\s*)?(\d+)\s*liều|(?:phác\s*đồ\s*)?(hai|ba)\s*liều",
            text.lower(),
        )
        word = {"hai": 2, "ba": 3}
        found_ns: list[int] = []
        for m in re.finditer(
            r"(?:phác\s*đồ\s*)?(\d+)\s*liều|(?:phác\s*đồ\s*)?(hai|ba)\s*liều",
            text.lower(),
        ):
            if m.group(1):
                found_ns.append(int(m.group(1)))
            elif m.group(2):
                found_ns.append(word[m.group(2)])
        for n in found_ns:
            label = age_g or note or text
            # Ưu tiên age_group làm nhãn nhóm
            label = age_g if age_g else note
            if not label:
                continue
            regimen.setdefault(n, [])
            if label not in regimen[n] and age_g not in " ".join(regimen[n]):
                # Tránh trùng
                if label not in regimen[n]:
                    regimen[n].append(label)

    lines: list[str] = []
    prefix = f"Đúng. Với {vlabel}" if is_confirm else f"Với {vlabel}"

    if regimen:
        # Có thông tin phác đồ N liều
        if is_confirm and 3 in regimen and re.search(
            r"(3\s*liều|ba liều).*(lớn|15|người lớn)|lớn.*(3\s*liều|ba liều)",
            (question or "").lower(),
        ):
            g3 = ", ".join(regimen.get(3, [])[:2]) or "từ khoảng 15 tuổi"
            g2 = ", ".join(regimen.get(2, [])[:2]) or "9-14 tuổi"
            lines.append(
                f"{prefix}, phác đồ 3 liều thường dùng cho nhóm {g3}; "
                f"phác đồ 2 liều thường cho nhóm {g2}."
            )
        elif is_confirm and 2 in regimen and re.search(
            r"(2\s*liều|hai liều).*(9|14|trẻ)",
            (question or "").lower(),
        ):
            g2 = ", ".join(regimen.get(2, [])[:2]) or "9-14 tuổi"
            g3 = ", ".join(regimen.get(3, [])[:2]) or "từ khoảng 15 tuổi"
            lines.append(
                f"{prefix}, phác đồ 2 liều thường cho nhóm {g2}; "
                f"phác đồ 3 liều thường cho nhóm {g3}."
            )
        else:
            lines.append(f"{prefix}:")
            for n in sorted(regimen.keys()):
                groups = ", ".join(regimen[n][:3])
                lines.append(f"- Phác đồ {n} liều: {groups}")
    else:
        # Không parse được "N liều" trong note → tóm tắt theo age_group unique
        ages = []
        for r in rows:
            age_g = (r.get("age_group") or "").strip()
            note = (r.get("note") or "").strip()
            if age_g and age_g not in ages:
                ages.append(age_g if not note else f"{age_g} ({note[:60]})")
        lines.append(f"{prefix}:")
        for a in ages[:6]:
            lines.append(f"- {a}")

    if sources:
        lines.append("Nguồn: " + ", ".join(sources[:3]) + ".")
    lines.append(
        "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tiêm."
    )
    return "\n".join(lines)



def _is_disease_question(text: str) -> bool:

    return bool(_DISEASE_Q.search(text or ""))


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
    """Tách trường từ chunk dạng:
    Vaccine: ...
    Phòng bệnh: ...
    Số mũi: ...
    Khoảng cách (ngày): ...
    Mô tả: ...
    """
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
            # cắt ở dòng tiếp theo nếu mô tả dài nhiều dòng
            if key == "description":
                # lấy phần sau "Mô tả:" đến hết hoặc đến field khác
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
    """Trả lời ngắn cho câu hỏi định nghĩa / phòng bệnh gì từ card có cấu trúc."""
    disease = card.get("disease")
    desc = card.get("description")
    name = card.get("name") or vlabel or "Vaccine này"
    if not disease and not desc:
        return None
    lines: list[str] = []
    if disease:
        lines.append(f"{name} dùng để phòng: {disease}.")
    if desc:
        # tránh lặp lại nếu mô tả đã chứa disease
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


_CARD_BY_VID: dict[int, dict[str, str]] | None = None


def _load_vaccine_cards() -> dict[int, dict[str, str]]:
    """Load thẻ vaccine có cấu trúc từ chunks.jsonl (không phụ thuộc FAISS)."""
    global _CARD_BY_VID
    if _CARD_BY_VID is not None:
        return _CARD_BY_VID
    out: dict[int, dict[str, str]] = {}
    try:
        from pathlib import Path
        import json

        root = Path(__file__).resolve().parents[3]
        path = root / "knowledge" / "chunks" / "chunks.jsonl"
        if path.exists():
            with path.open(encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                    except json.JSONDecodeError:
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


def _card_for_vaccine(
    vid: int | None, vax_names: list[str] | None = None
) -> dict[str, str]:
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


def _context_has_etiology(context: str) -> bool:
    if not context:
        return False
    return bool(_ETIOLOGY_CONTEXT.search(context))


_ADMIN_TITLE = re.compile(
    r"điều\s*\d+\s*\.\s*các\s*ông|chánh\s*văn\s*phòng\s*bộ|"
    r"cục\s*trưởng\s*cục\s*quản\s*lý",
    re.I,
)
_FORM_OR_ARTIFACT = re.compile(
    r"about:blank|□\s*có|□\s*không|i\.\s*khám\s*sàng\s*lọc|"
    r"phiếu\s*khám\s*sàng\s*lọc|bảng\s*kiểm\s*trước\s*tiêm",
    re.I,
)


def _clean_chunk_title(title: str, doc_id: str) -> str:
    """Bỏ tiêu đề hành chính (Điều X. Các ông, bà...) thay bằng doc_id ngắn."""
    t = (title or "").strip()
    if not t or _ADMIN_TITLE.search(t):
        short = (doc_id or "tài liệu").replace("_", " ")[:80]
        return short
    return t[:120]


def _is_low_quality_chunk(text: str, title: str) -> bool:
    """Loại chunk form sàng lọc / artifact PDF / phần hành chính thuần."""
    if not text or len(text.strip()) < 40:
        return True
    if _ADMIN_TITLE.search(title or "") and not re.search(
        r"chống\s*chỉ\s*định|tạm\s*hoãn|vắc\s*xin|vaccine|thai",
        text,
        re.I,
    ):
        return True
    if _FORM_OR_ARTIFACT.search(text) and len(re.findall(r"[•\-–]\s", text)) < 2:
        if text.count("□") >= 2 or "about:blank" in text.lower():
            return True
    # Chunk sàng lọc trẻ sinh non / tuổi thai hiệu chỉnh — không dùng khi hỏi thai phụ
    if re.search(
        r"trẻ\s*sinh\s*non|tuổi\s*thai\s*(hiệu\s*chỉnh|<)|"
        r"tạm\s*hoãn\s*tiêm\s*vắc\s*xin\s*phòng\s*lao|"
        r"đủ\s*34\s*tuần\s*tuổi",
        text,
        re.I,
    ):
        return True
    return False


def _try_retrieve(query: str, vaccine_id: int | None = None) -> dict:
    try:
        from app.services.model_loader import get_retriever

        retriever = get_retriever()
        if retriever is None:
            return {"hits": [], "enough_evidence": False, "max_score": 0.0}
        return retriever.retrieve(query, vaccine_id=vaccine_id)
    except Exception as e:
        logger.warning("Retrieval unavailable: %s", e)
        return {"hits": [], "enough_evidence": False, "max_score": 0.0}


def _normalize_vaccine_names(entities: dict[str, Any] | None) -> list[str]:
    """entities['vaccines'] có thể là list str hoặc list dict."""
    out: list[str] = []
    for v in (entities or {}).get("vaccines") or []:
        if isinstance(v, str) and v.strip():
            out.append(v.strip())
        elif isinstance(v, dict):
            name = v.get("name") or v.get("short") or v.get("vaccine_short")
            if name:
                out.append(str(name).strip())
    return out[:5]


def handle_faq_vaccine(
    message: str,
    session_id: str,
    conf: float,
    context: dict[str, Any] | None = None,
    entities: dict[str, Any] | None = None,
    history: list | None = None,
    **kwargs,
) -> ChatResponse:
    msg = (message or "").strip()
    if len(msg) <= 3 or (
        len(msg.split()) <= 2
        and len(msg) <= 12
        and not any(
            k in msg.lower()
            for k in (
                "hpv",
                "mmr",
                "bcg",
                "tdap",
                "adacel",
                "sởi",
                "cúm",
                "zona",
                "shingrix",
                "viêm gan",
                "uốn ván",
                "tiêm",
                "vaccine",
                "vắc",
                "covid",
                "lịch",
                "tuổi",
                "tháng",
                "mũi",
                "bệnh",
                "liều",
            )
        )
    ):
        from app.chatbot.handlers.fallback import handle_unknown

        return handle_unknown(message, session_id, conf)

    entities = entities or EntityExtractor().extract(message)
    vaccine_ids = list(entities.get("vaccine_ids") or [])
    vid = int(vaccine_ids[0]) if vaccine_ids else None
    vax_names = _normalize_vaccine_names(entities)
    disease_q = _is_disease_question(msg)
    subtype = classify_faq_subtype(msg)
    # Câu vừa tuổi vừa hỏi vaccine/mũi → ưu tiên subtype FAQ, không để general
    if subtype == "general" and has_substantive_question(msg):
        subtype = classify_faq_subtype(msg) or "definition"
        # classify again already general — map dose questions
        import re as _re
        if _re.search(r"mũi\s*\d+|khác mũi|phác đồ", msg.lower()):
            subtype = "regimen"
    mem = get_memory_store().get(session_id)
    soft = dict(mem.soft_context or {})

    # --- Early: phòng bệnh gì / dùng để làm gì — trả lời từ card, không qua RAG/mock ---
    if (subtype == "definition" or _is_definition_question(msg)) and (
        vid is not None or vax_names
    ):
        card = _card_for_vaccine(vid, vax_names)
        if card:
            vlabel = (vax_names[0] if vax_names else None) or card.get("name")
            def_reply = _format_definition_from_card(card, vlabel)
            if def_reply:
                actions_early: list[Action] = []
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
                get_memory_store().update_soft_context(
                    session_id,
                    {
                        "vaccine_ids": [vid] if vid is not None else [],
                        "vaccines": entities.get("vaccines") or [],
                    },
                )
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

    # Đang chờ tuổi cho FAQ chỉ định → user vừa trả tuổi → trả lời luôn (không sang schedule)
    if soft.get("awaiting_faq_age") and (
        entities.get("age_years") is not None or entities.get("age_months") is not None
    ):
        pending = soft.get("faq_pending_subtype") or "indication"
        mem.set_soft(
            awaiting_faq_age=False,
            age_years=entities.get("age_years") or soft.get("age_years"),
            age_months=entities.get("age_months") or soft.get("age_months"),
            age_source="user_message",
            age_confirmed=True,
        )
        soft = dict(mem.soft_context)
        subtype = pending if subtype in ("general", "confirm") else subtype
        # Khôi phục vaccine đang hỏi
        if not vax_names and soft.get("last_vaccines"):
            lv = soft["last_vaccines"]
            vax_names = [
                (x.get("name") if isinstance(x, dict) else str(x))
                for x in lv[:3]
            ]
            vax_names = [x for x in vax_names if x]
        if vid is None and soft.get("vaccine_ids"):
            try:
                vid = int(soft["vaccine_ids"][0])
            except (TypeError, ValueError, IndexError):
                pass
        # Trả lời chỉ định ngay nếu có vaccine
        if vid is not None or vax_names:
            from app.chatbot.vaccine_meta import (
                format_indication_from_meta,
                get_meta,
                get_meta_by_name,
            )
            meta = get_meta(vid) if vid is not None else get_meta_by_name(
                vax_names[0] if vax_names else None
            )
            vlabel = (vax_names[0] if vax_names else None) or (
                (meta or {}).get("short_name") if meta else "vaccine"
            )
            years = entities.get("age_years") or soft.get("age_years")
            months = entities.get("age_months") or soft.get("age_months")
            age_bit = ""
            if years is not None:
                age_bit = f" khoảng {years:g} tuổi"
            elif months is not None:
                age_bit = f" khoảng {int(months)} tháng"
            if meta:
                body = format_indication_from_meta(meta, str(vlabel), msg)
            else:
                body = (
                    f"Đã ghi nhận{age_bit}. Với {vlabel}, cần đối chiếu đúng nhóm tuổi "
                    f"và khám sàng lọc tại cơ sở trước khi tiêm."
                )
            reply = f"Đã ghi nhận{age_bit}.\n{body}"
            return ChatResponse(
                reply=reply,
                intent="faq_vaccine",
                intent_confidence=conf,
                session_id=session_id,
                meta={
                    "handler": "faq_vaccine",
                    "subtype": subtype,
                    "age_years": years,
                    "age_months": months,
                    "vaccine_id": vid,
                    "resumed_after_age": True,
                },
            )

    # Slot tuổi: hỏi tiêm được không / chưa tiêm mà chưa có tuổi
    age_years = entities.get("age_years") or soft.get("age_years")
    age_months = entities.get("age_months") or soft.get("age_months")
    if (
        needs_age_slot(subtype, msg)
        and age_years is None
        and age_months is None
        and vid is not None
    ):
        vlabel = vax_names[0] if vax_names else "vaccine này"
        mem.set_soft(
            awaiting_faq_age=True,
            faq_pending_subtype=subtype,
            last_vaccines=vax_names or soft.get("last_vaccines"),
            vaccine_ids=([vid] if vid is not None else soft.get("vaccine_ids")),
        )
        reply = (
            f"Để trả lời chính xác hơn về {vlabel}, bạn cho mình biết "
            f"tuổi người cần tiêm (ví dụ 25 tuổi hoặc 14 tuổi) nhé. "
            f"Mình không đoán tuổi khi chưa có thông tin."
        )
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            session_id=session_id,
            meta={
                "handler": "faq_vaccine",
                "subtype": subtype,
                "need_age": True,
                "followup_vaccines": vax_names,
            },
        )



    # Follow-up: câu không nhắc tên vaccine nhưng orchestrator đã gắn vaccines từ memory
    retrieve_q = message
    if vax_names and not any(n.lower() in message.lower() for n in vax_names):
        retrieve_q = f"{message} {' '.join(vax_names[:2])}"

    is_pregnant = bool(entities.get("is_pregnant") or soft.get("is_pregnant"))
    gest_weeks = entities.get("gestational_weeks") or soft.get("gestational_weeks")
    gest_months = entities.get("gestational_months") or soft.get("gestational_months")
    # Fallback regex nếu entity extractor chưa có field is_pregnant (bản code cũ)
    if not is_pregnant and re.search(
        r"(mang\s*thai|có\s*thai|thai\s*\d+\s*tuần|\d+\s*tuần\s*thai|"
        r"thai\s*phụ|pnct|(?:^|[\s,;])thai(?:\s+\d+|\s|$))",
        message or "",
        re.I,
    ):
        is_pregnant = True
        mw = re.search(r"(\d+)\s*tuần", message or "", re.I)
        if mw and gest_weeks is None:
            gest_weeks = float(mw.group(1))
            gest_months = round(gest_weeks / 4.345, 1)

    if is_pregnant:
        retrieve_q = (
            f"{message} phụ nữ có thai thai phụ tiêm chủng "
            f"uốn ván cúm chống chỉ định vắc xin sống"
        )
        if gest_weeks is not None:
            retrieve_q += f" {gest_weeks:g} tuần thai"
        get_memory_store().update_soft_context(
            session_id,
            {
                "is_pregnant": True,
                "gestational_weeks": gest_weeks,
                "gestational_months": gest_months,
            },
        )

    eligibility = check_eligibility_from_text(message)
    eligibility_block = ""
    if eligibility.status in ("defer_suggested", "caution", "pregnancy"):
        eligibility_block = format_eligibility_text(eligibility)

    # --- Trả lời thai kỳ SỚM, không gọi RAG (tránh chunk trẻ sinh non / BCG) ---
    _preg_q = re.compile(
        r"(được\s*(tiêm|vaccine|vắc)|vaccine\s*nào|cái\s*nào\s*(để|nên)|"
        r"nên\s*tiêm|không\s*được|chống\s*chỉ\s*định|tạm\s*hoãn|để\s*sau|"
        r"tiêm\s*gì|tiêm\s*được)",
        re.I,
    )
    if is_pregnant and _preg_q.search(message or ""):
        g_bit = ""
        if gest_weeks is not None:
            g_bit = f" (khoảng {gest_weeks:g} tuần)"
        elif gest_months is not None:
            g_bit = f" (khoảng {gest_months:g} tháng thai)"
        preg_reply = (
            f"Với phụ nữ đang mang thai{g_bit}, theo hướng dẫn / khuyến cáo đã nạp:\n"
            "• Có thể cân nhắc (sau khám sàng lọc): Uốn ván (Td/Tdap) theo tiền sử tiêm; "
            "Cúm (bất kỳ quý nào của thai kỳ).\n"
            "• Thường để sau khi sinh / chống chỉ định khi đang mang thai: vắc xin sống "
            "giảm độc lực (MMR/sởi–quai bị–rubella, thủy đậu, BCG, …).\n"
            "• Quyết định cuối cùng phụ thuộc tiền sử tiêm, tình trạng thai kỳ và khám "
            "sàng lọc tại cơ sở tiêm chủng.\n\n"
            "Nội dung mang tính tham khảo. Vui lòng xác nhận lại với nhân viên y tế "
            "trước khi quyết định.\n"
            "Nguồn định hướng: TT-10/2024, TT-52/2025, khuyến cáo cúm WHO; "
            "Hướng dẫn khám sàng lọc người lớn & PNCT."
        )
        if eligibility_block and eligibility.status == "pregnancy":
            # Không nhét block dài; giữ 1 câu disclaimer
            preg_reply = (
                "Câu hỏi liên quan thai kỳ — thông tin tham khảo, cần khám sàng lọc tại cơ sở.\n\n"
                + preg_reply
            )
        sources_p: list[Source] = [
            Source(
                doc_id="tt10-2024",
                title="Thông tư 10/2024/TT-BYT – lịch tiêm / thai phụ",
                issuer="Bộ Y tế",
                tier="A",
            ),
            Source(
                doc_id="who-flu",
                title="Khuyến cáo cúm WHO – thai kỳ",
                issuer="WHO",
                tier="A",
            ),
        ]
        guarded = enforce_guardrails(
            preg_reply,
            require_source_hint=False,
            known_sources=["TT-10/2024", "TT-52/2025"],
            question=message,
        )
        return ChatResponse(
            reply=guarded.text,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=sources_p,
            actions=[
                Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
            ],
            session_id=session_id,
            meta={
                "handler": "faq_vaccine",
                "pregnancy": True,
                "gestational_weeks": gest_weeks,
                "gestational_months": gest_months,
                "early_return": True,
                "guard_warnings": guarded.warnings,
            },
        )

    retrieval = _try_retrieve(retrieve_q, vaccine_id=vid)
    hits = retrieval.get("hits") or []
    enough = bool(retrieval.get("enough_evidence"))

    sources: list[Source] = []
    context_parts: list[str] = []
    for h in hits[:8]:  # lấy thêm rồi lọc
        text = h.get("text") or h.get("chunk") or ""
        raw_title = h.get("title") or h.get("doc_id") or "tài liệu"
        doc_id = str(h.get("doc_id") or raw_title)[:64]
        if _is_low_quality_chunk(text, str(raw_title)):
            continue
        title = _clean_chunk_title(str(raw_title), doc_id)
        tier = h.get("tier")
        # bỏ artifact PDF còn sót
        text = re.sub(r"\d{1,2}:\d{2}\s+\d{1,2}/\d{1,2}/\d{2,4}\s+about:blank", " ", text)
        text = re.sub(r"about:blank\s*\d+/\d+", " ", text)
        context_parts.append(f"[{title}]\n{text[:500]}")
        sources.append(
            Source(
                doc_id=doc_id,
                title=title,
                tier=str(tier) if tier else None,
                snippet=(text[:180] + "…") if len(text) > 180 else text,
                url=h.get("url"),
                issuer=h.get("issuer"),
            )
        )
        if len(context_parts) >= 5:
            break

    if eligibility.status in ("defer_suggested", "caution", "pregnancy"):
        sources.append(
            Source(
                doc_id="qd-1575-byt" if eligibility.status != "pregnancy" else "tt10-2024",
                title=(
                    "Hướng dẫn tiêm chủng thai phụ / TT-10"
                    if eligibility.status == "pregnancy"
                    else "Quyết định 1575/QĐ-BYT – Hướng dẫn khám sàng lọc trước tiêm"
                ),
                issuer="Bộ Y tế",
                tier="A",
            )
        )

    context_str = "\n\n".join(context_parts)
    actions: list[Action] = []
    if vid:
        actions.append(
            Action(
                type="OPEN_VACCINE",
                label="Xem chi tiết vaccine",
                vaccine_id=vid,
                path=f"/vaccines/{vid}",
            )
        )
    actions.append(
        Action(type="OPEN_BOOKING", label="Đặt lịch tiêm", path="/booking")
    )

    # --- Định nghĩa / phòng bệnh gì: ưu tiên card có cấu trúc, không dump "Khoảng cách (ngày)" ---
    if subtype == "definition" or _is_definition_question(msg):
        best_card: dict[str, str] = {}
        best_src: Source | None = None
        # 1) Ưu tiên map local theo vaccine_id (không phụ thuộc FAISS / mock)
        local_card = _card_for_vaccine(vid, vax_names)
        if local_card:
            best_card = local_card
        # 2) Bổ sung / ghi đè từ RAG hits nếu khớp hơn
        for h in hits[:8]:
            text = h.get("text") or h.get("chunk") or ""
            card = _parse_vaccine_card(text)
            if not card.get("disease") and not card.get("description"):
                continue
            name_l = (card.get("name") or "").lower()
            title_l = str(h.get("title") or "").lower()
            matched = False
            if vax_names:
                for n in vax_names:
                    nl = (n or "").lower()
                    if nl and (nl in name_l or nl in title_l or name_l in nl):
                        matched = True
                        break
            if vid is not None and h.get("vaccine_ids"):
                try:
                    if int(vid) in [int(x) for x in (h.get("vaccine_ids") or [])]:
                        matched = True
                except (TypeError, ValueError):
                    pass
            if matched or not best_card:
                best_card = card
                raw_title = h.get("title") or h.get("doc_id") or "tài liệu"
                doc_id = str(h.get("doc_id") or raw_title)[:64]
                best_src = Source(
                    doc_id=doc_id,
                    title=_clean_chunk_title(str(raw_title), doc_id),
                    tier=str(h.get("tier")) if h.get("tier") else "B",
                    snippet=(text[:180] + "…") if len(text) > 180 else text,
                    issuer=h.get("issuer"),
                )
            if matched and best_card.get("disease"):
                break
        if best_card:
            vlabel = (vax_names[0] if vax_names else None) or best_card.get("name")
            def_reply = _format_definition_from_card(best_card, vlabel)
            if def_reply:
                def_sources = [best_src] if best_src else (
                    [
                        Source(
                            doc_id="db-vaccine",
                            title=best_card.get("name") or "Thông tin vaccine",
                            tier="B",
                            issuer="VaxCare",
                        )
                    ]
                    if best_card
                    else sources[:2]
                )
                return ChatResponse(
                    reply=def_reply,
                    intent="faq_vaccine",
                    intent_confidence=conf,
                    sources=def_sources,
                    actions=actions,
                    session_id=session_id,
                    meta={
                        "handler": "faq_vaccine",
                        "subtype": "definition",
                        "vaccine_id": vid,
                        "from_structured_card": True,
                        "followup_vaccines": vax_names,
                    },
                )

    # Giải thích mũi N / khác mũi trước — mọi vaccine (không hard-code)
    if subtype == "regimen" and (vid is not None or vax_names):
        try:
            from app.chatbot.rules.age_rules_loader import protocol_for_vaccine
            from app.chatbot.vaccine_meta import format_dose_explain, get_meta_by_name, get_meta
            rows = []
            if vid is not None:
                rows = protocol_for_vaccine(int(vid))
            vlabel = vax_names[0] if vax_names else "vaccine"
            if not rows and vax_names:
                meta = get_meta_by_name(vax_names[0])
                if meta:
                    vid = int(meta["vaccine_id"])
                    rows = protocol_for_vaccine(vid)
                    vlabel = meta.get("short_name") or vlabel
            dose_no = entities.get("dose_number")
            try:
                dose_no = int(dose_no) if dose_no is not None else None
            except (TypeError, ValueError):
                dose_no = None
            am = entities.get("age_months") or soft.get("age_months")
            if rows:
                reply = format_dose_explain(
                    rows,
                    str(vlabel),
                    dose_no,
                    question=msg,
                    age_months=am,
                )
                return ChatResponse(
                    reply=reply,
                    intent="faq_vaccine",
                    intent_confidence=conf,
                    sources=sources,
                    actions=actions,
                    session_id=session_id,
                    meta={
                        "handler": "faq_vaccine",
                        "subtype": "regimen",
                        "dose_explain": True,
                        "dose_number": dose_no,
                        "vaccine_id": vid,
                        "followup_vaccines": vax_names,
                    },
                )
        except Exception as e:
            logger.warning("dose explain failed: %s", e)

    # Phản ứng sau tiêm — trả lời an toàn, không LLM dump
    if subtype == "post_vax":
        from app.chatbot.vaccine_meta import format_post_vax_answer
        vlabel = vax_names[0] if vax_names else None
        reply = format_post_vax_answer(msg, vlabel)
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=sources,
            actions=actions,
            session_id=session_id,
            safe_mode=True,
            meta={
                "handler": "faq_vaccine",
                "subtype": "post_vax",
                "vaccine_id": vid,
                "followup_vaccines": vax_names,
            },
        )

    # Bắt buộc / tiêm hàng năm — ưu tiên vaccine_meta, không dump PDF
    if subtype == "mandatory":
        from app.chatbot.vaccine_meta import (
            format_mandatory_answer,
            get_meta,
            get_meta_by_name,
        )
        meta = get_meta(vid) if vid is not None else None
        if meta is None and vax_names:
            meta = get_meta_by_name(vax_names[0])
        vlabel = (vax_names[0] if vax_names else None) or (
            (meta or {}).get("short_name") if meta else "vaccine"
        )
        if meta:
            reply = format_mandatory_answer(meta, str(vlabel))
        else:
            reply = (
                "Có bắt buộc hay cần tiêm hàng năm phụ thuộc từng loại vaccine và đối tượng. "
                "Bạn nêu rõ tên vaccine và độ tuổi để mình đối chiếu tài liệu đã nạp. "
                "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tiêm."
            )
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=sources,
            actions=actions,
            session_id=session_id,
            meta={
                "handler": "faq_vaccine",
                "subtype": "mandatory",
                "vaccine_id": vid,
                "followup_vaccines": vax_names,
                "used_meta": bool(meta),
            },
        )

    if disease_q:
        if not enough or not _context_has_etiology(context_str):
            reply = (
                "Mình chưa có tài liệu về nguyên nhân hay đường lây của bệnh này.\n\n"
                "Nếu cần phần tiêm phòng, bạn có thể hỏi:\n"
                f"{_disease_examples(msg)}"
            )
            return ChatResponse(
                reply=reply,
                intent="faq_vaccine",
                intent_confidence=conf,
                sources=[],
                actions=actions,
                session_id=session_id,
                meta={
                    "handler": "faq_vaccine",
                    "disease_question": True,
                    "enough_evidence": False,
                    "rejected_reason": "no_etiology_in_kb",
                    "eligibility": eligibility.to_dict(),
                    "followup_vaccines": vax_names,
                },
            )

    completed = _stated_completed_dose(msg)
    if completed is not None and vid is not None and (
        _asks_next_dose(msg) or _is_protocol_question(msg)
    ):
        try:
            from app.chatbot.rules.age_rules_loader import protocol_for_vaccine

            rows = protocol_for_vaccine(int(vid))
            next_dose = completed + 1
            next_rows = [r for r in rows if int(r.get("dose_number") or 0) == next_dose]
            interval = None
            note = ""
            for r in next_rows:
                try:
                    iv = r.get("interval_days_min")
                    if iv is not None and float(iv) > 0:
                        interval = int(float(iv))
                except (TypeError, ValueError):
                    pass
                note = (r.get("note") or note) or ""
            vlabel = vax_names[0] if vax_names else "vaccine"
            protect = ""
            for h in hits[:3]:
                tx = h.get("text") or ""
                if "type" in tx.lower() or "phòng" in tx.lower() or "HPV" in tx:
                    protect = tx[:220]
                    break
            parts = [
                f"Bạn cho biết đã tiêm {vlabel} mũi {completed} "
                f"(không nêu ngày tiêm cụ thể)."
            ]
            if interval:
                parts.append(
                    f"Theo phác đồ tham khảo, mũi {next_dose} thường cách mũi trước "
                    f"ít nhất {interval} ngày"
                    + (f" ({note})" if note else "")
                    + ". "
                    "Muốn biết lịch trên lịch của bạn, cần ngày tiêm mũi trước "
                    "(hoặc hồ sơ trên VaxCare)."
                )
            elif next_rows:
                parts.append(
                    f"Có mốc mũi {next_dose} trong bảng quy tắc"
                    + (f": {note}" if note else "")
                    + ". Cần ngày tiêm mũi trước để tính lịch cụ thể."
                )
            else:
                parts.append(
                    f"Trong bảng quy tắc hiện có chưa rõ khoảng cách tới mũi {next_dose}. "
                    "Bạn hỏi nhân viên y tế hoặc xem tờ hướng dẫn sản phẩm."
                )
            if protect and (
                "type" in msg.lower() or "phòng" in msg.lower() or "type" in msg
            ):
                parts.append("Về phòng bệnh / type (theo tài liệu): " + protect)
            elif (
                "type" in msg.lower()
                or "phòng type" in msg.lower()
                or "phòng bệnh" in msg.lower()
            ):
                if protect:
                    parts.append(protect)
                else:
                    parts.append(
                        "Chi tiết type HPV phòng được phụ thuộc loại vắc xin (Gardasil…); "
                        "xem trang vaccine hoặc HDSD tại cơ sở."
                    )
            reply = "\n\n".join(parts)
            return ChatResponse(
                reply=reply,
                intent="faq_vaccine",
                intent_confidence=conf,
                sources=sources,
                actions=actions,
                session_id=session_id,
                meta={
                    "handler": "faq_vaccine",
                    "completed_dose": completed,
                    "next_dose": next_dose,
                    "interval_days_min": interval,
                    "no_invented_date": True,
                    "followup_vaccines": vax_names,
                },
            )
        except Exception as e:
            logger.warning("next-dose rule failed: %s", e)

    # Hỏi tiêm được không / ai cần / chưa tiêm (subtype chung mọi vaccine)
    if vid is not None and (
        subtype in ("indication", "never_vaccinated")
        or _is_can_i_vaccinate_question(msg)
    ):
        try:
            from app.chatbot.rules.age_rules_loader import protocol_for_vaccine
            from app.chatbot.vaccine_meta import format_indication_from_meta, get_meta
            rows = protocol_for_vaccine(int(vid))
            vlabel = vax_names[0] if vax_names else (
                (rows[0].get("vaccine_short") if rows else None) or "vaccine"
            )
            meta = get_meta(int(vid))
            # Ưu tiên meta khi hỏi trẻ/già hoặc chưa có note phác đồ giàu
            if meta and (
                subtype in ("indication", "never_vaccinated")
                or not rows
            ):
                reply = format_indication_from_meta(meta, str(vlabel), msg)
            else:
                reply = _indication_answer_from_rows(rows or [], str(vlabel), msg)
            known = [
                str(r.get("source_doc") or "") for r in (rows or []) if r.get("source_doc")
            ]
            if not sources:
                for k in (known or [str(vlabel)])[:3]:
                    if not k:
                        continue
                    sources.append(
                        Source(doc_id=k[:32], title=k, tier="B", issuer="Bộ Y tế / WHO")
                    )
            return ChatResponse(
                reply=reply,
                intent="faq_vaccine",
                intent_confidence=conf,
                sources=sources,
                actions=actions,
                session_id=session_id,
                meta={
                    "handler": "faq_vaccine",
                    "indication": True,
                    "vaccine_id": vid,
                    "followup_vaccines": vax_names,
                },
            )
        except Exception as e:
            logger.warning("indication answer failed: %s", e)


    # Khoảng cách mũi — lấy từ rule, không để LLM bịa
    if subtype == "interval" and vid is not None:
        try:
            from app.chatbot.rules.age_rules_loader import protocol_for_vaccine
            rows = protocol_for_vaccine(int(vid))
            vlabel = vax_names[0] if vax_names else "vaccine"
            intervals = []
            for r in rows:
                try:
                    d = int(r.get("dose_number") or 0)
                    iv = r.get("interval_days_min")
                    if iv is not None and float(iv) > 0 and d >= 2:
                        intervals.append((d, int(float(iv)), (r.get("note") or "").strip()))
                except (TypeError, ValueError):
                    pass
            if intervals:
                lines = [f"Với {vlabel}, khoảng cách tham khảo giữa các mũi:"]
                for d, iv, note in intervals[:4]:
                    bit = f"- Trước mũi {d}: ít nhất {iv} ngày"
                    if note:
                        bit += f" ({note[:80]})"
                    lines.append(bit)
                lines.append(
                    "Nội dung mang tính tham khảo; xác nhận lại với nhân viên y tế trước khi tiêm."
                )
                return ChatResponse(
                    reply="\n".join(lines),
                    intent="faq_vaccine",
                    intent_confidence=conf,
                    sources=sources,
                    actions=actions,
                    session_id=session_id,
                    meta={
                        "handler": "faq_vaccine",
                        "subtype": "interval",
                        "vaccine_id": vid,
                    },
                )
        except Exception as e:
            logger.warning("interval from rules failed: %s", e)


    if (_is_protocol_question(msg) or _is_confirm_followup(msg)) and vid is not None:
        try:
            from app.chatbot.rules.age_rules_loader import (
                format_protocol_text,
                protocol_for_vaccine,
            )

            rows = protocol_for_vaccine(int(vid))
            if rows:
                vlabel = (
                    vax_names[0]
                    if vax_names
                    else (
                        rows[0].get("vaccine_short") or f"vaccine_id={vid}"
                    )
                )
                known = [
                    str(r.get("source_doc") or "") for r in rows if r.get("source_doc")
                ]
                known = [k for k in known if k] or [
                    "Thông tư 10/2024/TT-BYT",
                    "khuyến cáo WHO",
                ]

                # Chỉ short regimen khi hỏi số liều / xác nhận — không khi "tiêm được không"
                if (
                    not _is_can_i_vaccinate_question(msg)
                    and (
                        _is_confirm_followup(msg)
                        or (
                            len(msg) <= 100
                            and re.search(
                                r"(vậy là|thế là|phải không|đúng không|"
                                r"2\s*liều|3\s*liều|phác đồ)",
                                msg.lower(),
                            )
                            and not re.search(
                                r"(chi tiết|đầy đủ|từng mũi|toàn bộ)", msg.lower()
                            )
                        )
                    )
                ):
                    summary = _short_protocol_summary(
                        rows, str(vlabel), question=msg,
                        is_confirm=_is_confirm_followup(msg),
                    )
                    if not sources:
                        for k in known[:3]:
                            sources.append(
                                Source(
                                    doc_id=k[:32],
                                    title=k,
                                    tier="B",
                                    issuer="Bộ Y tế / WHO",
                                )
                            )
                    return ChatResponse(
                        reply=summary,
                        intent="faq_vaccine",
                        intent_confidence=conf,
                        sources=sources,
                        actions=actions,
                        session_id=session_id,
                        meta={
                            "handler": "faq_vaccine",
                            "protocol": True,
                            "protocol_style": "short",
                            "vaccine_id": vid,
                            "followup_vaccines": vax_names,
                        },
                    )

                protocol_txt = format_protocol_text(rows, str(vlabel))
                # Bỏ markdown ** nếu loader còn in
                protocol_txt = protocol_txt.replace("**", "")
                reply_body = protocol_txt
                known_guard = known
                guarded = enforce_guardrails(
                    reply_body,
                    require_source_hint=True,
                    known_sources=known_guard,
                    question=message,
                )
                if not sources:
                    for k in known[:3]:
                        sources.append(
                            Source(
                                doc_id=k[:32],
                                title=k,
                                tier="A",
                                issuer="Bộ Y tế / WHO",
                            )
                        )
                return ChatResponse(
                    reply=guarded.text,
                    intent="faq_vaccine",
                    intent_confidence=conf,
                    sources=sources,
                    actions=actions,
                    session_id=session_id,
                    meta={
                        "handler": "faq_vaccine",
                        "protocol": True,
                        "protocol_style": "full",
                        "vaccine_id": vid,
                        "n_rules": len(rows),
                        "guard_warnings": guarded.warnings,
                        "followup_vaccines": vax_names,
                    },
                )
        except Exception as e:
            logger.warning("protocol_for_vaccine failed: %s", e)

    if not enough and not context_str and eligibility.status == "ok_to_discuss":
        hint = ""
        if vax_names:
            hint = f" (đang theo chủ đề {', '.join(vax_names[:2])})"
        reply = (
            "Mình chưa tìm đủ tài liệu khớp câu hỏi"
            + hint
            + ". Bạn thử nêu rõ tên vaccine (HPV, viêm gan B, sởi, COVID…)."
        )
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=[],
            actions=actions,
            session_id=session_id,
            meta={
                "handler": "faq_vaccine",
                "enough_evidence": False,
                "rejected_reason": retrieval.get("rejected_reason"),
                "eligibility": eligibility.to_dict(),
                "followup_vaccines": vax_names,
            },
        )

    if eligibility.status == "defer_suggested" and not enough:
        reply = (
            eligibility_block
            + "\n\nChatbot không kết luận chống chỉ định tuyệt đối. "
            "Vui lòng khám sàng lọc tại cơ sở tiêm chủng trước khi tiêm."
        )
        return ChatResponse(
            reply=reply,
            intent="faq_vaccine",
            intent_confidence=conf,
            sources=sources,
            actions=actions,
            session_id=session_id,
            safe_mode=True,
            meta={
                "handler": "faq_vaccine",
                "enough_evidence": False,
                "eligibility": eligibility.to_dict(),
            },
        )

    messages = build_messages(
        "faq_vaccine",
        question=message,
        context=context_str,
        rule_result=eligibility_block,
        history=history,
    )
    try:
        raw = get_llm_client().generate(messages)
    except Exception as e:
        logger.warning("LLM generate failed in faq: %s", e)
        raw = ""

    known = [s.title for s in sources if s.title]
    guarded = enforce_guardrails(
        raw if raw else (
            context_str[:800]
            if context_str
            else "Chưa đủ tài liệu để trả lời chính xác. Bạn thử nêu rõ tên vaccine."
        ),
        require_source_hint=True,
        known_sources=known,
        question=message,
    )

    return ChatResponse(
        reply=guarded.text,
        intent="faq_vaccine",
        intent_confidence=conf,
        sources=sources,
        actions=actions,
        session_id=session_id,
        safe_mode=eligibility.needs_clinician,
        meta={
            "handler": "faq_vaccine",
            "subtype": subtype,
            "disease_question": disease_q,
            "enough_evidence": enough,
            "n_hits": len(hits),
            "max_score": retrieval.get("max_score"),
            "raw_max_score": retrieval.get("raw_max_score"),
            "rejected_reason": retrieval.get("rejected_reason"),
            "guard_warnings": guarded.warnings,
            "eligibility": eligibility.to_dict(),
            "followup_vaccines": vax_names,
            "retrieve_q": retrieve_q[:120],
        },
    )
