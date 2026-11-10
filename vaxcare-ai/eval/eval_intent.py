"""Evaluate intent classifier + hybrid (regex + classifier) on testset_v1_intents."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.chatbot.intent.classifier import IntentClassifier
from app.chatbot.intent.labels import INTENT_LABELS
from app.chatbot.orchestrator import _guess_intent
from app.core.config import settings

MODEL_PATH = ROOT / "models" / "intent_clf.joblib"
_ALIGNED = ROOT / "knowledge" / "testsets" / "testset_v1_intents.csv"
_LEGACY = ROOT / "intent_data" / "test.csv"
TEST_PATH = _ALIGNED if _ALIGNED.exists() else _LEGACY
REPORT_DIR = ROOT / "eval" / "reports"


def _metrics(y_true, y_pred, labels):
    acc = accuracy_score(y_true, y_pred)
    f1_macro = f1_score(y_true, y_pred, average="macro", labels=labels, zero_division=0)
    f1_weighted = f1_score(
        y_true, y_pred, average="weighted", labels=labels, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    return acc, f1_macro, f1_weighted, cm


def main() -> None:
    if not TEST_PATH.exists():
        print(f"Không thấy testset: {TEST_PATH}")
        sys.exit(1)

    df = pd.read_csv(TEST_PATH)
    label_col = "intent" if "intent" in df.columns else "label"
    text_col = "text" if "text" in df.columns else "question"
    y_true = df[label_col].astype(str).tolist()
    texts = df[text_col].astype(str).tolist()
    labels = list(INTENT_LABELS)

    # --- Hybrid (production path) ---
    y_hybrid = []
    confs_h = []
    for t in texts:
        lab, conf = _guess_intent(t)
        y_hybrid.append(lab)
        confs_h.append(conf)

    acc_h, f1m_h, f1w_h, cm_h = _metrics(y_true, y_hybrid, labels)
    print("=== HYBRID (regex + classifier) — production path ===")
    print(f"Accuracy     = {acc_h:.4f}")
    print(f"F1 macro     = {f1m_h:.4f}")
    print(f"F1 weighted  = {f1w_h:.4f}")
    print(f"Mean conf    = {float(np.mean(confs_h)):.4f}")
    print(f"intent_min_confidence setting = {settings.intent_min_confidence}")
    print("\n" + classification_report(y_true, y_hybrid, labels=labels, zero_division=0))
    print("Confusion matrix hybrid (rows=true, cols=pred):")
    print(pd.DataFrame(cm_h, index=labels, columns=labels))

    report = {
        "hybrid": {
            "accuracy": acc_h,
            "f1_macro": f1m_h,
            "f1_weighted": f1w_h,
            "mean_confidence": float(np.mean(confs_h)),
            "confusion_matrix": cm_h.tolist(),
        },
        "n_test": len(df),
        "labels": labels,
        "intent_min_confidence": settings.intent_min_confidence,
        "testset": str(TEST_PATH.relative_to(ROOT)),
    }

    if MODEL_PATH.exists():
        try:
            clf = IntentClassifier.load(
                MODEL_PATH, min_confidence=settings.intent_min_confidence
            )
            y_clf = []
            confs_c = []
            for t in texts:
                lab, conf = clf.predict(t)
                y_clf.append(lab)
                confs_c.append(conf)
            acc_c, f1m_c, f1w_c, cm_c = _metrics(y_true, y_clf, labels)
            print("\n=== CLASSIFIER ONLY ===")
            print(f"Accuracy     = {acc_c:.4f}")
            print(f"F1 macro     = {f1m_c:.4f}")
            print(f"F1 weighted  = {f1w_c:.4f}")
            print(f"Mean conf    = {float(np.mean(confs_c)):.4f}")
            print(
                "\n"
                + classification_report(y_true, y_clf, labels=labels, zero_division=0)
            )
            report["classifier_only"] = {
                "accuracy": acc_c,
                "f1_macro": f1m_c,
                "f1_weighted": f1w_c,
                "mean_confidence": float(np.mean(confs_c)),
                "confusion_matrix": cm_c.tolist(),
                "min_confidence": clf.min_confidence,
            }
        except Exception as e:
            print(f"\n[WARN] Cannot eval classifier-only: {e}")
            report["classifier_only_error"] = str(e)
    else:
        print("\n[INFO] No intent model found — skip classifier-only metrics")

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    out = REPORT_DIR / "intent_metrics.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nĐã ghi {out}")


if __name__ == "__main__":
    main()
