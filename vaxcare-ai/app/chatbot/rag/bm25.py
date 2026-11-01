"""BM25 keyword search – hybrid với FAISS."""

from __future__ import annotations

import re
from typing import Sequence


def _tokenize(text: str) -> list[str]:
    text = text.lower()
    # giữ token chữ/số tiếng Việt đơn giản
    return re.findall(r"[a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+", text)


class BM25Store:
    def __init__(self, corpus: Sequence[str], metas: list[dict] | None = None):
        try:
            from rank_bm25 import BM25Okapi
        except ImportError as e:
            raise ImportError("Cài rank_bm25: pip install rank-bm25") from e

        self._tokens = [_tokenize(t) for t in corpus]
        self._bm25 = BM25Okapi(self._tokens)
        self.metas = metas or [{"idx": i} for i in range(len(corpus))]

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        q = _tokenize(query)
        if not q:
            return []
        scores = self._bm25.get_scores(q)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
        out = []
        for rank, (idx, sc) in enumerate(ranked, 1):
            if sc <= 0:
                continue
            meta = dict(self.metas[idx])
            meta["score"] = float(sc)
            meta["rank"] = rank
            meta["bm25_idx"] = idx
            out.append(meta)
        return out
