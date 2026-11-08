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
        min_score: float = 0.50,
        hybrid_alpha: float = 0.65,
        score_margin: float = 0.10,
        min_hits_for_evidence: int = 1,
        rrf_k: int = 60,
        use_rrf: bool = True,
    ):
        """
        hybrid_alpha: trọng số điểm dense khi fusion tuyến tính (nếu không dùng RRF).
        min_score: ngưỡng cosine/IP tuyệt đối – dưới mức này coi như không khớp.
        score_margin: top1 phải cao hơn hit tham chiếu ít nhất margin để tránh
                      nhận câu hỏi ngoài miền (negative) làm có căn cứ.
        use_rrf: Reciprocal Rank Fusion – ổn định hơn min-max khi BM25 scale lệch.
        """
        self.embedder = embedder
        self.store = store
        self.bm25 = bm25
        self.top_k = top_k
        self.min_score = min_score
        self.hybrid_alpha = hybrid_alpha
        self.score_margin = score_margin
        self.min_hits_for_evidence = min_hits_for_evidence
        self.rrf_k = rrf_k
        self.use_rrf = use_rrf

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
        fetch_k = max(k * 4, 12)
        dense_hits = self.store.search(
            qvec, top_k=fetch_k, vaccine_id=vaccine_id, min_score=0.0
        )

        if self.bm25 is not None:
            sparse_hits = self.bm25.search(query, top_k=fetch_k)
            if self.use_rrf:
                fused = self._fuse_rrf(dense_hits, sparse_hits, k=fetch_k)
            else:
                fused = self._fuse(dense_hits, sparse_hits, k=fetch_k)
        else:
            fused = dense_hits

        if vaccine_id is not None:
            for h in fused:
                vids = h.get("vaccine_ids") or []
                if vaccine_id in vids:
                    h["score"] = float(h.get("score", 0)) + 0.05
            fused.sort(key=lambda x: float(x.get("score", 0)), reverse=True)

        raw_max = max((float(h.get("score", 0)) for h in fused), default=0.0)

        # 1) Lọc theo ngưỡng tuyệt đối
        above = [h for h in fused if float(h.get("score", 0)) >= thr]

        # 2) Kiểm tra margin
        rejected_reason = None
        enough = False
        if len(above) >= self.min_hits_for_evidence:
            scores = sorted((float(h.get("score", 0)) for h in fused), reverse=True)
            top1 = scores[0] if scores else 0.0
            ref_idx = min(len(scores) - 1, max(k, 4))
            ref = scores[ref_idx] if scores else 0.0
            if top1 - ref < self.score_margin and top1 < (thr + 0.10):
                rejected_reason = "low_score_margin"
                above = []
            else:
                enough = True
        else:
            rejected_reason = "below_min_score"

        # 3) Heuristic bổ sung cho negative queries
        if enough and self._looks_out_of_domain(query) and raw_max < (thr + 0.15):
            rejected_reason = "out_of_domain_heuristic"
            above = []
            enough = False

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

    @staticmethod
    def _looks_out_of_domain(query: str) -> bool:
        t = (query or "").lower()
        markers = (
            "thời tiết", "bóng đá", "giá vàng", "chứng khoán", "nấu ăn",
            "công thức", "phim", "ca sĩ", "bài hát", "cho chó", "thú cưng",
            "máy tính", "lập trình", "python code", "crypto", "bitcoin",
            "chính trị", "bầu cử", "du lịch", "khách sạn",
        )
        return any(m in t for m in markers)

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

    def _fuse_rrf(
        self, dense: list[dict], sparse: list[dict], k: int
    ) -> list[dict]:
        """Reciprocal Rank Fusion – ổn định hơn khi scale BM25 và dense khác nhau."""
        rrf_k = self.rrf_k

        def key_of(h: dict) -> str:
            return str(h.get("chunk_id") or h.get("bm25_idx") or id(h))

        scores: dict[str, float] = {}
        meta_by_key: dict[str, dict] = {}
        dense_raw: dict[str, float] = {}
        sparse_raw: dict[str, float] = {}

        for rank, h in enumerate(dense, 1):
            key = key_of(h)
            scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
            meta_by_key[key] = h
            dense_raw[key] = float(h.get("score", 0))

        for rank, h in enumerate(sparse, 1):
            key = key_of(h)
            scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
            if key not in meta_by_key:
                meta_by_key[key] = h
            sparse_raw[key] = float(h.get("score", 0))

        if not scores:
            return []
        max_rrf = max(scores.values()) or 1.0
        fused = []
        for key, rrf_s in scores.items():
            rrf_norm = rrf_s / max_rrf
            d_raw = dense_raw.get(key, 0.0)
            final = 0.70 * rrf_norm + 0.30 * d_raw
            meta = dict(meta_by_key[key])
            meta["score"] = float(final)
            meta["rrf_score"] = float(rrf_s)
            meta["dense_score"] = d_raw
            meta["sparse_score"] = sparse_raw.get(key, 0.0)
            fused.append(meta)

        fused.sort(key=lambda x: x["score"], reverse=True)
        return fused[:k]
