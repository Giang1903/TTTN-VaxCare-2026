from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.chatbot.rag.embedder import load_embedder
from app.chatbot.rag.retriever import Retriever
from app.chatbot.rag.vector_store import VectorStore

INDEX_PATH = ROOT / "knowledge" / "index" / "faiss.index"
META_PATH = ROOT / "knowledge" / "index" / "chunks_meta.json"

GOLD = [
    {"query": "Khám sàng lọc trước tiêm chủng", "must_contain": ["sàng lọc", "1575"]},
    {"query": "Chống chỉ định tiêm", "must_contain": ["chống chỉ định", "sàng lọc"]},
    {"query": "vaccine trong hệ thống", "must_contain": ["db-vaccine", "db-protocol", "vaccine"]},
]


def hit_matches(h: dict, keys: list[str]) -> bool:
    blob = (str(h.get("doc_id", "")) + " " + str(h.get("text", ""))).lower()
    return any(k.lower() in blob for k in keys)


def main() -> None:
    if not INDEX_PATH.exists():
        print("Chưa có chỉ mục vector — hãy build bằng notebook rồi chạy lại.")
        sys.exit(1)

    metas = json.loads(META_PATH.read_text(encoding="utf-8"))
    texts = [m.get("text") or "" for m in metas]
    embedder = load_embedder(prefer_bge=True, corpus_for_tfidf=texts)
    store = VectorStore.load(INDEX_PATH, META_PATH)

    bm25 = None
    try:
        from app.chatbot.rag.bm25 import BM25Store

        bm25 = BM25Store(texts, metas=metas)
    except Exception:
        pass

    min_score = 0.15 if "tfidf" in embedder.model_name else 0.35
    retriever = Retriever(embedder, store, bm25=bm25, top_k=5, min_score=min_score)

    k = 5
    ok_n = 0
    for g in GOLD:
        r = retriever.retrieve(g["query"], top_k=k, min_score=0.0)
        ok = any(hit_matches(h, g["must_contain"]) for h in r["hits"])
        ok_n += int(ok)
        print(f"{'OK' if ok else 'MISS'} | {g['query']}")

    recall = ok_n / len(GOLD)
    print(f"Recall@{k} = {ok_n}/{len(GOLD)} = {recall:.2f}")
    print("embedder:", embedder.model_name)


if __name__ == "__main__":
    main()
