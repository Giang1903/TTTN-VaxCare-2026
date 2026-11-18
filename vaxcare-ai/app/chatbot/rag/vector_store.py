from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(
        self,
        index: Any,
        metas: list[dict],
        model_name: str = "",
        dim: int = 0,
    ):
        self.index = index
        self.metas = metas
        self.model_name = model_name
        self.dim = dim

    @property
    def size(self) -> int:
        return len(self.metas)

    def search(
        self,
        query_vec: np.ndarray,
        top_k: int = 5,
        vaccine_id: int | None = None,
        min_score: float = 0.0,
    ) -> list[dict]:
        """
        query_vec: shape (dim,) hoặc (1, dim), đã L2-normalize.
        Trả list dict: {score, rank, **meta}.
        Nếu vaccine_id: ưu tiên chunk có vaccine_id trong meta['vaccine_ids'],
        fallback toàn bộ nếu không đủ top_k.
        """
        if query_vec.ndim == 1:
            query_vec = query_vec.reshape(1, -1)
        query_vec = query_vec.astype(np.float32)

        # lấy nhiều hơn top_k để lọc
        fetch = min(max(top_k * 5, top_k), self.size) if vaccine_id is not None else min(top_k, self.size)
        if fetch <= 0:
            return []

        scores, idxs = self.index.search(query_vec, fetch)
        scores = scores[0]
        idxs = idxs[0]

        hits: list[dict] = []
        for score, idx in zip(scores, idxs):
            if idx < 0:
                continue
            sc = float(score)
            if sc < min_score:
                continue
            meta = dict(self.metas[idx])
            meta["score"] = sc
            hits.append(meta)

        if vaccine_id is not None:
            filtered = [
                h
                for h in hits
                if vaccine_id in (h.get("vaccine_ids") or [])
            ]
            if len(filtered) >= top_k:
                hits = filtered
            elif filtered:
                # bổ sung hit không match vaccine_id
                extra = [h for h in hits if h not in filtered]
                hits = filtered + extra

        for i, h in enumerate(hits[:top_k]):
            h["rank"] = i + 1
        return hits[:top_k]

    def save(self, index_path: Path, meta_path: Path, build_info: dict | None = None) -> None:
        import faiss

        index_path = Path(index_path)
        meta_path = Path(meta_path)
        index_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(index_path))
        meta_path.write_text(
            json.dumps(self.metas, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        if build_info is not None:
            info_path = index_path.parent / "build_info.json"
            info_path.write_text(
                json.dumps(build_info, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        logger.info("Saved FAISS index n=%s → %s", self.size, index_path)

    @classmethod
    def load(cls, index_path: Path, meta_path: Path) -> "VectorStore":
        import faiss

        index_path = Path(index_path)
        meta_path = Path(meta_path)
        index = faiss.read_index(str(index_path))
        metas = json.loads(meta_path.read_text(encoding="utf-8"))
        dim = index.d
        return cls(index=index, metas=metas, dim=dim)

    @classmethod
    def build_from_embeddings(
        cls,
        embeddings: np.ndarray,
        metas: list[dict],
        model_name: str = "",
    ) -> "VectorStore":
        import faiss

        embeddings = np.asarray(embeddings, dtype=np.float32)
        assert embeddings.ndim == 2
        n, dim = embeddings.shape
        assert n == len(metas)
        # Inner product trên vector L2-norm = cosine similarity
        index = faiss.IndexFlatIP(dim)
        index.add(embeddings)
        return cls(index=index, metas=metas, model_name=model_name, dim=dim)
