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
    "dtap": 3,
    "tdap": 3,
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
    "thủy đậu": 7,
    "varicella": 7,
    "phế cầu": 8,
    "pneumococcal": 8,
    "viêm não nhật bản": 9,
    "viêm não": 9,
    "cúm": 10,
    "influenza": 10,
    "hpv": 11,
    "covid": 12,
    "covid-19": 12,
    "covid19": 12,
    "dại": 14,
    "rabies": 14,
    "zona": 13,
    "shingrix": 13,
    "herpes zoster": 13,
}


AGE_PATTERNS = [
    # 20 tuổi, 20t
    (re.compile(r"(\d+)\s*(?:tuổi|t)\b", re.I), "years"),
    # 14 tháng
    (re.compile(r"(\d+)\s*tháng", re.I), "months"),
    # sơ sinh
    (re.compile(r"\bsơ\s*sinh\b", re.I), "newborn"),
]

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
        age = self._find_age(t)
        dose = self._find_dose(t)
        return {
            "vaccine_ids": [v["vaccine_id"] for v in vaccines],
            "vaccines": vaccines,
            "age_years": age.get("years"),
            "age_months": age.get("months"),
            "dose_number": dose,
            "raw": text,
        }

    def _find_vaccines(self, t: str) -> list[dict]:
        found: list[dict] = []
        seen: set[int] = set()
        # ưu tiên alias dài hơn
        for alias, vid in sorted(self.alias_to_id.items(), key=lambda x: -len(x[0])):
            if alias in t and vid not in seen:
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
