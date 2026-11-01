from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from app.chatbot.intent.labels import INTENT_LABELS

logger = logging.getLogger(__name__)


class IntentClassifier:
    def __init__(
        self,
        pipeline: Any,
        labels: list[str] | None = None,
        min_confidence: float = 0.45,
    ):
        self.pipeline = pipeline
        self.labels = labels or list(INTENT_LABELS)
        self.min_confidence = min_confidence

    def predict(self, text: str) -> tuple[str, float]:
        """Trả (label, confidence). Confidence = max softmax/proba."""
        proba = self.predict_proba(text)
        idx = int(np.argmax(proba))
        label = self.labels[idx] if idx < len(self.labels) else self.labels[0]
        conf = float(proba[idx])
        return label, conf

    def predict_proba(self, text: str) -> np.ndarray:
        texts = [text or ""]
        if hasattr(self.pipeline, "predict_proba"):
            proba = self.pipeline.predict_proba(texts)[0]
            # map theo classes_ của model nếu có
            classes = list(getattr(self.pipeline, "classes_", self.labels))
            out = np.zeros(len(self.labels), dtype=np.float64)
            for i, c in enumerate(classes):
                if c in self.labels:
                    out[self.labels.index(c)] = proba[i]
            return out
        # fallback: predict only
        pred = self.pipeline.predict(texts)[0]
        out = np.zeros(len(self.labels), dtype=np.float64)
        if pred in self.labels:
            out[self.labels.index(pred)] = 1.0
        return out

    def is_confident(self, confidence: float) -> bool:
        return confidence >= self.min_confidence

    @classmethod
    def load(cls, path: str | Path, min_confidence: float = 0.45) -> "IntentClassifier":
        path = Path(path)
        obj = joblib.load(path)
        if isinstance(obj, IntentClassifier):
            obj.min_confidence = min_confidence
            return obj
        if isinstance(obj, dict):
            return cls(
                pipeline=obj["pipeline"],
                labels=obj.get("labels", list(INTENT_LABELS)),
                min_confidence=obj.get("min_confidence", min_confidence),
            )
        # raw sklearn pipeline
        labels = list(getattr(obj, "classes_", INTENT_LABELS))
        return cls(pipeline=obj, labels=labels, min_confidence=min_confidence)

    def save(self, path: str | Path) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "pipeline": self.pipeline,
                "labels": self.labels,
                "min_confidence": self.min_confidence,
            },
            path,
        )
        logger.info("Saved intent classifier → %s", path)
