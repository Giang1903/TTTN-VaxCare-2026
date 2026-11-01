"""BGE-M3 embedder – mã hóa câu hỏi / chunk thành vector.

Ưu tiên FlagEmbedding (BAAI/bge-m3). Fallback sentence-transformers.
Nếu không cài được model nặng, dùng FakeEmbedder (TF-IDF) chỉ để dev offline.
"""

from __future__ import annotations

import logging
from typing import Sequence

import numpy as np

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "BAAI/bge-m3"


class Embedder:
    """Interface chung: encode(texts) -> np.ndarray (n, dim), L2-normalized."""

    def encode(self, texts: Sequence[str], batch_size: int = 16) -> np.ndarray:
        raise NotImplementedError

    @property
    def dim(self) -> int:
        raise NotImplementedError

    @property
    def model_name(self) -> str:
        raise NotImplementedError


class BGEEmbedder(Embedder):
    def __init__(self, model_name: str = DEFAULT_MODEL, use_fp16: bool = True):
        self._model_name = model_name
        self._model = None
        self._backend = None
        self._dim: int | None = None
        self._use_fp16 = use_fp16
        self._load()

    def _load(self) -> None:
        # 1) FlagEmbedding
        try:
            from FlagEmbedding import BGEM3FlagModel

            self._model = BGEM3FlagModel(self._model_name, use_fp16=self._use_fp16)
            self._backend = "flag"
            # probe dim
            vec = self._model.encode(["test"])["dense_vecs"]
            self._dim = int(np.asarray(vec).shape[-1])
            logger.info("Loaded BGE-M3 via FlagEmbedding dim=%s", self._dim)
            return
        except Exception as e:
            logger.warning("FlagEmbedding unavailable: %s", e)

        # 2) sentence-transformers
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self._model_name)
            self._backend = "st"
            self._dim = int(self._model.get_sentence_embedding_dimension())
            logger.info("Loaded BGE via sentence-transformers dim=%s", self._dim)
            return
        except Exception as e:
            logger.warning("sentence-transformers unavailable: %s", e)
            raise RuntimeError(
                "Không load được BGE-M3. Cài: pip install FlagEmbedding "
                "hoặc sentence-transformers, rồi tải model BAAI/bge-m3"
            ) from e

    def encode(self, texts: Sequence[str], batch_size: int = 16) -> np.ndarray:
        texts = [t if t and t.strip() else " " for t in texts]
        if self._backend == "flag":
            out = self._model.encode(
                list(texts),
                batch_size=batch_size,
                max_length=512,
            )["dense_vecs"]
            arr = np.asarray(out, dtype=np.float32)
        else:
            arr = np.asarray(
                self._model.encode(
                    list(texts),
                    batch_size=batch_size,
                    normalize_embeddings=True,
                    show_progress_bar=False,
                ),
                dtype=np.float32,
            )
        # L2 normalize
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms = np.clip(norms, 1e-12, None)
        return arr / norms

    @property
    def dim(self) -> int:
        assert self._dim is not None
        return self._dim

    @property
    def model_name(self) -> str:
        return self._model_name


class TfidfEmbedder(Embedder):
    """Fallback nhẹ cho dev/test khi chưa có GPU / chưa tải BGE-M3."""

    def __init__(self, corpus: Sequence[str] | None = None, max_features: int = 2048):
        from sklearn.feature_extraction.text import TfidfVectorizer

        self._vectorizer = TfidfVectorizer(max_features=max_features, ngram_range=(1, 2))
        seed = list(corpus) if corpus else ["vaccine tiêm chủng"]
        self._vectorizer.fit(seed)
        self._dim = len(self._vectorizer.get_feature_names_out())
        self._name = f"tfidf-{max_features}"

    def fit_corpus(self, corpus: Sequence[str]) -> None:
        self._vectorizer.fit(list(corpus))
        self._dim = len(self._vectorizer.get_feature_names_out())

    def encode(self, texts: Sequence[str], batch_size: int = 16) -> np.ndarray:
        arr = self._vectorizer.transform(list(texts)).astype(np.float32).toarray()
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms = np.clip(norms, 1e-12, None)
        return arr / norms

    @property
    def dim(self) -> int:
        return self._dim

    @property
    def model_name(self) -> str:
        return self._name


def load_embedder(
    model_name: str = DEFAULT_MODEL,
    prefer_bge: bool = True,
    corpus_for_tfidf: Sequence[str] | None = None,
) -> Embedder:
    if prefer_bge:
        try:
            return BGEEmbedder(model_name=model_name)
        except Exception as e:
            logger.warning("Fall back to TF-IDF embedder: %s", e)
    return TfidfEmbedder(corpus=corpus_for_tfidf)
