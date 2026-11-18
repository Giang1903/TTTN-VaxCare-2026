from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

DEFAULT_ALIASES: dict[str, int] = {
    "bcg": 1,
    "viêm gan b": 2,
    "hep b": 2,
    "hepatitis b": 2,
    "vgb": 2,
    "dtap": 3,
    "dtp": 3,
    "5-in-1": 3,
    "5 trong 1": 3,
    "6 trong 1": 3,
    "hexaxim": 3,
    "infanrix": 3,
    "pentaxim": 3,
    "tdap": 3,
    "td": 3,
    "adacel": 3,
    "boostrix": 3,
    "bạch hầu": 3,
    "ho gà": 3,
    "uốn ván": 3,
    "ipv": 4,
    "bại liệt": 4,
    "polio": 4,
    "hib": 5,
    "mmr": 6,
    "sởi": 6,
    "quai bị": 6,
    "rubella": 6,
    "priorix": 6,
    "thủy đậu": 7,
    "varicella": 7,
    "varivax": 7,
    "varilrix": 7,
    "phế cầu": 8,
    "pneumococcal": 8,
    "prevenar": 8,
    "prevenar 13": 8,
    "prevenar 20": 8,
    "pcv": 8,
    "pcv13": 8,
    "pcv20": 8,
    "je": 9,
    "viêm não nhật bản": 9,
    "viêm não": 9,
    "imojev": 9,
    "jespect": 9,
    "cúm": 10,
    "influenza": 10,
    "vaxigrip": 10,
    "influvac": 10,
    "hpv": 11,
    "gardasil": 11,
    "gardasil 9": 11,
    "cervarix": 11,
    "covid": 12,
    "covid-19": 12,
    "covid19": 12,
    "dại": 14,
    "rabies": 14,
    "verorab": 14,
    "zona": 13,
    "shingrix": 13,
    "herpes zoster": 13,
}


AGE_PATTERNS = [
    # 20 tuổi, 20t
    (re.compile(r"(\d+)\s*(?:tuổi|t)\b", re.I), "years"),
    # 14 tháng (chronological; avoid "tháng thai")
    (re.compile(r"(\d+)\s*tháng(?!\s*thai)", re.I), "months"),
    # sơ sinh
    (re.compile(r"\bsơ\s*sinh\b", re.I), "newborn"),
]

# Thai kỳ / phụ nữ có thai
PREGNANCY_MARKERS = re.compile(
    r"\b(mang\s*thai|có\s*thai|phụ\s*nữ\s*có\s*thai|pnct|thai\s*phụ|"
    r"đang\s*mang\s*thai|thai\s*kỳ|trong\s*thai\s*kỳ)\b|"
    r"(?:^|[\s,;])thai(?:\s|$|,|;|\d)",
    re.I,
)
# 20 tuần / 5 tháng thai / tuần thai 20 / tháng thứ 4
GESTATIONAL_WEEK_PAT = re.compile(
    r"(?:thai\s*)?(\d+)\s*tuần(?:\s*thai)?|(?:tuần\s*thai\s*)(\d+)",
    re.I,
)
GESTATIONAL_MONTH_PAT = re.compile(
    r"(?:thai\s*)?(\d+)\s*tháng\s*thai|"
    r"(?:tháng\s*thai\s*)(\d+)|"
    r"tháng\s*thứ\s*(\d+)|"
    r"(\d+)\s*tháng\s*(?:mang\s*)?thai",
    re.I,
)

DOSE_PATTERNS = [
    re.compile(r"mũi\s*(\d+)", re.I),
    re.compile(r"liều\s*(\d+)", re.I),
    re.compile(r"dose\s*(\d+)", re.I),
]


class EntityExtractor:
    def __init__(self, vaccines_path: str | Path | None = None):
        self.alias_to_id = dict(DEFAULT_ALIASES)
        self.id_to_name: dict[int, str] = {}
        if vaccines_path:
            self._load_vaccines(Path(vaccines_path))

    def _load_vaccines(self, path: Path) -> None:
        if not path.exists():
            return
        data = json.loads(path.read_text(encoding="utf-8"))
        for v in data:
            vid = int(v["vaccine_id"])
            short = (v.get("short_name") or v.get("vaccine_name") or "").lower()
            disease = (v.get("target_disease") or "").lower()
            self.id_to_name[vid] = v.get("short_name") or v.get("vaccine_name")
            if short:
                self.alias_to_id[short] = vid
            for part in re.split(r"[,/–-]", disease):
                p = part.strip().lower()
                if len(p) >= 3:
                    self.alias_to_id.setdefault(p, vid)

    def extract(self, text: str) -> dict[str, Any]:
        t = text.lower()
        vaccines = self._find_vaccines(t)
        preg = self._find_pregnancy(t)
        # Khi đang hỏi thai kỳ: không lấy "X tháng" làm tuổi lịch sử trẻ/người lớn
        if preg["is_pregnant"]:
            age = {"years": None, "months": None}
        else:
            age = self._find_age(t)
        dose = self._find_dose(t)
        return {
            "vaccine_ids": [v["vaccine_id"] for v in vaccines],
            "vaccines": vaccines,
            "age_years": age.get("years"),
            "age_months": age.get("months"),
            "dose_number": dose,
            "is_pregnant": preg["is_pregnant"],
            "gestational_weeks": preg["gestational_weeks"],
            "gestational_months": preg["gestational_months"],
            "raw": text,
        }

    def _find_vaccines(self, t: str) -> list[dict]:
        found: list[dict] = []
        seen: set[int] = set()
        # ưu tiên alias dài hơn; alias ngắn (≤3) bắt theo ranh giới từ
        for alias, vid in sorted(self.alias_to_id.items(), key=lambda x: -len(x[0])):
            if vid in seen:
                continue
            if len(alias) <= 3:
                if not re.search(rf"(?<![\wà-ỹ]){re.escape(alias)}(?![\wà-ỹ])", t, re.I):
                    continue
            elif alias not in t:
                continue
            seen.add(vid)
            found.append(
                {
                    "vaccine_id": vid,
                    "matched": alias,
                    "name": self.id_to_name.get(vid, alias),
                }
            )
        return found

    def _find_age(self, t: str) -> dict:
        out: dict[str, float | None] = {"years": None, "months": None}
        if re.search(r"\bsơ\s*sinh\b", t):
            out["years"] = 0
            out["months"] = 0
            return out
        for pat, kind in AGE_PATTERNS:
            m = pat.search(t)
            if not m:
                continue
            if kind == "newborn":
                out["years"] = 0
                out["months"] = 0
            elif kind == "years":
                out["years"] = float(m.group(1))
                out["months"] = float(m.group(1)) * 12
            elif kind == "months":
                months = float(m.group(1))
                out["months"] = months
                out["years"] = round(months / 12, 2)
            break
        return out

    def _find_dose(self, t: str) -> int | None:
        for pat in DOSE_PATTERNS:
            m = pat.search(t)
            if m:
                return int(m.group(1))
        return None

    def _find_pregnancy(self, t: str) -> dict[str, Any]:
        """Phát hiện thai kỳ và tuổi thai (tuần/tháng)."""
        is_preg = bool(PREGNANCY_MARKERS.search(t))
        weeks: float | None = None
        months: float | None = None

        mw = GESTATIONAL_WEEK_PAT.search(t)
        if mw:
            raw = mw.group(1) or mw.group(2)
            if raw:
                weeks = float(raw)
                months = round(weeks / 4.345, 1)  # ~4.345 tuần/tháng
                is_preg = True

        mm = GESTATIONAL_MONTH_PAT.search(t)
        if mm and months is None:
            raw = next((g for g in mm.groups() if g is not None), None)
            if raw:
                months = float(raw)
                weeks = round(months * 4.345, 1)
                is_preg = True

        # "Thai 20 tuần" không có từ "mang thai" nhưng đã bắt qua tuần
        if not is_preg and re.search(r"\bthai\b", t) and (weeks or months):
            is_preg = True

        return {
            "is_pregnant": is_preg,
            "gestational_weeks": weeks,
            "gestational_months": months,
        }
