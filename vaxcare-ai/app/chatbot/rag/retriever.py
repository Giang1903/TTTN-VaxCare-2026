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
        min_score: float = 0.45,
        hybrid_alpha: float = 0.7,
        score_margin: float = 0.08,
        min_hits_for_evidence: int = 1,
    ):
        """
        hybrid_alpha: trọng số điểm dense (FAISS). BM25 chuẩn hóa min-max rồi trộn.
        min_score: ngưỡng cosine/IP tuyệt đối – dưới mức này coi như không khớp.
        score_margin: top1 phải cao hơn hit yếu (percentile thấp) ít nhất margin
                      để tránh nhận câu hỏi ngoài miền (negative) làm có căn cứ.
        """
        self.embedder = embedder
        self.store = store
        self.bm25 = bm25
        self.top_k = top_k
        self.min_score = min_score
        self.hybrid_alpha = hybrid_alpha
        self.score_margin = score_margin
        self.min_hits_for_evidence = min_hits_for_evidence

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
            "raw_max_score": float,
            "rejected_reason": str | None,
          }
        """
        k = top_k or self.top_k
        thr = self.min_score if min_score is None else min_score

        qvec = self.embedder.encode([query])[0]
        # Lấy rộng hơn để tính margin / lọc ngưỡng
        fetch_k = max(k * 3, 10)
        dense_hits = self.store.search(
            qvec, top_k=fetch_k, vaccine_id=vaccine_id, min_score=0.0
        )

        if self.bm25 is not None:
            sparse_hits = self.bm25.search(query, top_k=fetch_k)
            fused = self._fuse(dense_hits, sparse_hits, k=fetch_k)
        else:
            fused = dense_hits

        raw_max = max((float(h.get("score", 0)) for h in fused), default=0.0)

        # 1) Lọc theo ngưỡng tuyệt đối
        above = [h for h in fused if float(h.get("score", 0)) >= thr]

        # 2) Kiểm tra margin: top phải tách biệt khỏi phần còn lại
        #    (giúp neg_ok_rate: câu ngoài miền thường có score phẳng)
        rejected_reason = None
        enough = False
        if len(above) >= self.min_hits_for_evidence:
            scores = sorted((float(h.get("score", 0)) for h in fused), reverse=True)
            top1 = scores[0] if scores else 0.0
            # so với median của top fetch hoặc score thứ k+1
            ref_idx = min(len(scores) - 1, max(k, 3))
            ref = scores[ref_idx] if scores else 0.0
            if top1 - ref < self.score_margin and top1 < (thr + 0.12):
                # Score phẳng / không nổi bật → khả năng cao là negative / ngoài miền
                rejected_reason = "low_score_margin"
                above = []
            else:
                enough = True
        else:
            rejected_reason = "below_min_score"

        hits = above[:k]
        max_score = max((float(h.get("score", 0)) for h in hits), default=0.0)
        if not hits:
            enough = False

        for i, h in enumerate(hits):
            h["rank"] = i + 1

        return {
            "hits": hits,
            "enough_evidence": enough,
            "max_score": max_score,
            "raw_max_score": raw_max,
            "query": query,
            "rejected_reason": rejected_reason,
        }

    def _fuse(self, dense: list[dict], sparse: list[dict], k: int) -> list[dict]:
        """Weighted fusion theo chunk_id (dense ưu tiên meta)."""
        alpha = self.hybrid_alpha

        def key_of(h: dict) -> str:
            return str(h.get("chunk_id") or h.get("bm25_idx") or id(h))

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
