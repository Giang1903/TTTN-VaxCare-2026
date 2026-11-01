"""Retriever: gộp FAISS + BM25, chọn top-k, ngưỡng 'không đủ căn cứ'."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np

from app.chatbot.rag.embedder import Embedder
from app.chatbot.rag.vector_store import VectorStore

logger = logging.getLogger(__name__)


class Retriever:
    def __init__(
        self,
        embedder: Embedder,
        store: VectorStore,
        bm25: Any | None = None,
        top_k: int = 5,
        min_score: float = 0.35,
        hybrid_alpha: float = 0.7,
    ):
        """
        hybrid_alpha: trọng số điểm dense (FAISS). BM25 chuẩn hóa min-max rồi trộn.
        """
        self.embedder = embedder
        self.store = store
        self.bm25 = bm25
        self.top_k = top_k
        self.min_score = min_score
        self.hybrid_alpha = hybrid_alpha

    def retrieve(
        self,
        query: str,
        top_k: int | None = None,
        vaccine_id: int | None = None,
        min_score: float | None = None,
    ) -> dict:
        """
        Returns:
          {
            "hits": [...],
            "enough_evidence": bool,
            "max_score": float,
            "query": str,
          }
        """
        k = top_k or self.top_k
        thr = self.min_score if min_score is None else min_score

        qvec = self.embedder.encode([query])[0]
        dense_hits = self.store.search(
            qvec, top_k=k, vaccine_id=vaccine_id, min_score=0.0
        )

        if self.bm25 is not None:
            sparse_hits = self.bm25.search(query, top_k=k * 2)
            hits = self._fuse(dense_hits, sparse_hits, k=k)
        else:
            hits = dense_hits[:k]

        # áp ngưỡng
        hits = [h for h in hits if float(h.get("score", 0)) >= thr][:k]
        max_score = max((float(h.get("score", 0)) for h in hits), default=0.0)
        enough = len(hits) > 0 and max_score >= thr

        for i, h in enumerate(hits):
            h["rank"] = i + 1

        return {
            "hits": hits,
            "enough_evidence": enough,
            "max_score": max_score,
            "query": query,
        }

    def _fuse(self, dense: list[dict], sparse: list[dict], k: int) -> list[dict]:
        """RRF-like / weighted fusion theo chunk_id."""
        alpha = self.hybrid_alpha

        def key_of(h: dict) -> str:
            return str(h.get("chunk_id") or h.get("bm25_idx") or id(h))

        # chuẩn hóa score từng nhánh
        def norm_scores(items: list[dict]) -> dict[str, float]:
            if not items:
                return {}
            vals = [float(x.get("score", 0)) for x in items]
            lo, hi = min(vals), max(vals)
            out = {}
            for x in items:
                s = float(x.get("score", 0))
                ns = 0.0 if hi - lo < 1e-9 else (s - lo) / (hi - lo)
                out[key_of(x)] = ns
            return out

        dmap = norm_scores(dense)
        smap = norm_scores(sparse)
        all_keys = set(dmap) | set(smap)

        # giữ meta từ dense ưu tiên
        meta_by_key: dict[str, dict] = {}
        for h in sparse + dense:
            meta_by_key[key_of(h)] = h

        fused = []
        for key in all_keys:
            ds = dmap.get(key, 0.0)
            ss = smap.get(key, 0.0)
            score = alpha * ds + (1 - alpha) * ss
            meta = dict(meta_by_key[key])
            meta["score"] = float(score)
            meta["dense_score"] = ds
            meta["sparse_score"] = ss
            fused.append(meta)

        fused.sort(key=lambda x: x["score"], reverse=True)
        return fused[:k]
