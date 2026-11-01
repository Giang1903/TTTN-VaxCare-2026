"""Đánh giá intent classifier: accuracy, F1, confusion matrix.

Chạy (từ vaxcare-ai):
  python -m eval.eval_intent
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
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

MODEL_PATH = ROOT / "models" / "intent_clf.joblib"
TEST_PATH = ROOT / "intent_data" / "test.csv"
REPORT_DIR = ROOT / "eval" / "reports"


def main() -> None:
    if not MODEL_PATH.exists():
        print("Chưa có model intent — hãy train (notebook train_intent) rồi chạy lại.")
        sys.exit(1)
    if not TEST_PATH.exists():
        print("Không thấy intent_data/test.csv")
        sys.exit(1)

    clf = IntentClassifier.load(MODEL_PATH)
    df = pd.read_csv(TEST_PATH)
    y_true = df["label"].astype(str).tolist()
    y_pred = []
    confs = []
    for t in df["text"].astype(str):
        lab, conf = clf.predict(t)
        y_pred.append(lab)
        confs.append(conf)

    labels = list(INTENT_LABELS)
    acc = accuracy_score(y_true, y_pred)
    f1_macro = f1_score(y_true, y_pred, average="macro", labels=labels, zero_division=0)
    f1_weighted = f1_score(
        y_true, y_pred, average="weighted", labels=labels, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    print(f"Accuracy     = {acc:.4f}")
    print(f"F1 macro     = {f1_macro:.4f}")
    print(f"F1 weighted  = {f1_weighted:.4f}")
    print(f"Mean conf    = {float(np.mean(confs)):.4f}")
    print("\n" + classification_report(y_true, y_pred, labels=labels, zero_division=0))
    print("Confusion matrix (rows=true, cols=pred):")
    print(pd.DataFrame(cm, index=labels, columns=labels))

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "accuracy": acc,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "mean_confidence": float(np.mean(confs)),
        "n_test": len(df),
        "labels": labels,
        "confusion_matrix": cm.tolist(),
        "min_confidence": clf.min_confidence,
    }
    out = REPORT_DIR / "intent_metrics.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nĐã ghi {out}")


if __name__ == "__main__":
    main()
