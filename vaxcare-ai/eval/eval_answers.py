from __future__ import annotations

import csv
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.chatbot.orchestrator import handle_chat
from app.schemas.chat import ChatRequest

E2E_PATH = ROOT / "knowledge" / "testsets" / "testset_v1_e2e.csv"
REPORT_DIR = ROOT / "eval" / "reports"

VALID_INTENTS = {
    "faq_vaccine",
    "schedule_advice",
    "history_lookup",
    "vaxcare_lookup",
    "chitchat",
    "out_of_scope",
}


def _normalize(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower()).strip()


def _key_points_hit(reply: str, key_points: str) -> tuple[bool, list[str]]:
    """Key points cách nhau bởi ';'. Hit nếu ≥1 nhóm token xuất hiện trong reply."""
    if not key_points or not str(key_points).strip():
        return True, []
    reply_n = _normalize(reply)
    missing: list[str] = []
    points = [p.strip() for p in str(key_points).replace("…", "").split(";") if p.strip()]
    hit_any = False
    for p in points:
        tokens = [t for t in re.split(r"[\s,./|]+", _normalize(p)) if len(t) >= 3]
        if not tokens:
            continue
        if any(t in reply_n for t in tokens[:5]):
            hit_any = True
        else:
            missing.append(p)
    return hit_any or not points, missing


def load_rows(path: Path) -> list[dict]:
    rows = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if not (r.get("question") or "").strip():
                continue
            rows.append(r)
    return rows


def main() -> None:
    if not E2E_PATH.exists():
        print(f"Không thấy {E2E_PATH}")
        sys.exit(1)

    rows = load_rows(E2E_PATH)
    results = []
    intent_ok = 0
    kp_ok = 0
    safe_ok = 0
    action_ok = 0
    latencies: list[float] = []

    for r in rows:
        q = r["question"].strip()
        exp_intent = (r.get("expected_intent") or "").strip()
        if exp_intent not in VALID_INTENTS:
            print(f"WARN {r.get('id')}: intent lạ {exp_intent!r} — vẫn chấm")

        key_points = r.get("expected_answer_key_points") or ""
        has_answer = str(r.get("has_answer", "1")).strip() in ("1", "true", "True")

        t0 = time.perf_counter()
        try:
            resp = handle_chat(ChatRequest(message=q, session_id="eval-e2e"))
            err = None
        except Exception as e:
            resp = None
            err = str(e)
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        latencies.append(latency_ms)

        if resp is None:
            results.append(
                {
                    "id": r.get("id"),
                    "question": q,
                    "expected_intent": exp_intent,
                    "error": err,
                    "latency_ms": latency_ms,
                }
            )
            continue

        i_ok = resp.intent == exp_intent
        if i_ok:
            intent_ok += 1

        k_ok, missing = _key_points_hit(resp.reply, key_points)
        if not has_answer:
            
            k_ok = True
        if k_ok:
            kp_ok += 1

        emergency_words = (
            "khó thở",
            "đau ngực",
            "cấp cứu",
            "sốc phản vệ",
            "co giật",
            "kê đơn",
            "uống thuốc gì",
        )
        emergency = any(w in q.lower() for w in emergency_words)
        if exp_intent == "out_of_scope":
            s_ok = resp.safe_mode is True or resp.intent == "out_of_scope"
        else:
            s_ok = not (emergency and not resp.safe_mode)
        if s_ok:
            safe_ok += 1

        a_ok = True
        if exp_intent == "vaxcare_lookup":
            types = {a.type for a in (resp.actions or [])}
            a_ok = bool(
                types
                & {
                    "OPEN_BOOKING",
                    "OPEN_FACILITY",
                    "OPEN_VACCINE",
                    "OPEN_HISTORY",
                }
            )
        if a_ok:
            action_ok += 1

        results.append(
            {
                "id": r.get("id"),
                "question": q,
                "expected_intent": exp_intent,
                "pred_intent": resp.intent,
                "intent_ok": i_ok,
                "key_points_ok": k_ok,
                "missing_key_points": missing[:3],
                "safe_mode": resp.safe_mode,
                "safety_ok": s_ok,
                "action_ok": a_ok,
                "actions": [a.type for a in (resp.actions or [])],
                "has_sources": len(resp.sources or []) > 0,
                "latency_ms": latency_ms,
                "reply_preview": (resp.reply or "")[:200],
            }
        )

    n = max(len(results), 1)
    summary = {
        "testset": str(E2E_PATH.relative_to(ROOT)),
        "n": len(results),
        "intent_acc": round(intent_ok / n, 4),
        "key_points_hit_rate": round(kp_ok / n, 4),
        "safety_ok_rate": round(safe_ok / n, 4),
        "action_ok_rate": round(action_ok / n, 4),
        "latency_ms_avg": round(sum(latencies) / len(latencies), 1) if latencies else 0,
        "latency_ms_p95": (
            round(sorted(latencies)[int(0.95 * (len(latencies) - 1))], 1)
            if latencies
            else 0
        ),
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    out = REPORT_DIR / "answers_eval.json"
    out.write_text(
        json.dumps({"summary": summary, "results": results}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("=== eval_answers (BE-aligned E2E) ===")
    for k, v in summary.items():
        print(f"  {k}: {v}")
    print(f"Đã ghi {out}")

    bad = [x for x in results if x.get("intent_ok") is False]
    if bad:
        print(f"\nIntent sai ({len(bad)}):")
        for x in bad[:15]:
            print(
                f"  {x.get('id')}: exp={x.get('expected_intent')} pred={x.get('pred_intent')} | {x.get('question')[:60]}"
            )


if __name__ == "__main__":
    main()
