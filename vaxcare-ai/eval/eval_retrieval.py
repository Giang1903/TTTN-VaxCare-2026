from __future__ import annotations

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.chatbot.rag.embedder import load_embedder
from app.chatbot.rag.retriever import Retriever
from app.chatbot.rag.vector_store import VectorStore

INDEX_PATH = ROOT / "knowledge" / "index" / "faiss.index"
META_PATH = ROOT / "knowledge" / "index" / "chunks_meta.json"
TESTSET = ROOT / "knowledge" / "testsets" / "testset_v1_retrieval.csv"
REPORT = ROOT / "eval" / "reports" / "retrieval_eval.json"


def load_testset(path: Path) -> list[dict]:
    rows = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            if not (r.get("question") or "").strip():
                continue
            rows.append(r)
    return rows


def chunk_id_from_hit(h: dict) -> str:
    for key in ("chunk_id", "id", "doc_id"):
        v = h.get(key)
        if v:
            return str(v).strip()
    return ""


def main() -> None:
    if not INDEX_PATH.exists():
        print("Chưa có FAISS index — build index rồi chạy lại.")
        sys.exit(1)
    if not TESTSET.exists():
        print(f"Không thấy {TESTSET}")
        sys.exit(1)

    metas = json.loads(META_PATH.read_text(encoding="utf-8"))
    texts = [m.get("text") or "" for m in metas]
    index_chunk_ids = set()
    for m in metas:
        for key in ("chunk_id", "id", "doc_id"):
            if m.get(key):
                index_chunk_ids.add(str(m[key]).strip())

    embedder = load_embedder(prefer_bge=True, corpus_for_tfidf=texts)
    store = VectorStore.load(INDEX_PATH, META_PATH)

    if getattr(embedder, "dim", None) and store.dim and embedder.dim != store.dim:
        print(
            f"CẢNH BÁO: embedder dim={embedder.dim} != index dim={store.dim}. "
            "Cần BGE-M3 cùng model lúc build index — kết quả sẽ sai."
        )

    bm25 = None
    try:
        from app.chatbot.rag.bm25 import BM25Store

        bm25 = BM25Store(texts, metas=metas)
    except Exception as e:
        print(f"BM25 skip: {e}")

    min_score = 0.15 if "tfidf" in getattr(embedder, "model_name", "") else 0.48
    retriever = Retriever(
        embedder, store, bm25=bm25, top_k=5, min_score=min_score, score_margin=0.08
    )

    rows = load_testset(TESTSET)

    by_q: dict[str, dict] = {}
    for r in rows:
        q = r["question"].strip()
        entry = by_q.setdefault(
            q,
            {
                "question": q,
                "intent": r.get("intent"),
                "gold_chunks": set(),
                "is_negative": False,
            },
        )
        rel = str(r.get("is_relevant", "1")).strip() in ("1", "true", "True")
        cid = (r.get("chunk_id") or "").strip()
        if rel and cid:
            entry["gold_chunks"].add(cid)
        if not rel and not cid:
            entry["is_negative"] = True

    k_list = [1, 3, 5]
    hits_at = {k: 0 for k in k_list}
    mrr_sum = 0.0
    n_pos = 0
    n_neg = 0
    neg_ok = 0
    details = []

    for q, entry in by_q.items():
        gold = entry["gold_chunks"]
        result = retriever.retrieve(q, top_k=max(k_list))
        ranked_ids = [chunk_id_from_hit(h) for h in result.get("hits") or []]
        ranked_ids = [x for x in ranked_ids if x]

        if gold:
            n_pos += 1
            rank = None
            for i, cid in enumerate(ranked_ids, start=1):
                if cid in gold or any(g in cid or cid in g for g in gold):
                    rank = i
                    break
            if rank is not None:
                mrr_sum += 1.0 / rank
                for k in k_list:
                    if rank <= k:
                        hits_at[k] += 1
            details.append(
                {
                    "question": q[:100],
                    "gold": sorted(gold),
                    "top5": ranked_ids[:5],
                    "rank_first_gold": rank,
                    "type": "positive",
                }
            )
        else:
            n_neg += 1
            enough = bool(result.get("enough_evidence"))
            ok = not enough
            if ok:
                neg_ok += 1
            details.append(
                {
                    "question": q[:100],
                    "top5": ranked_ids[:5],
                    "enough_evidence": enough,
                    "type": "negative",
                    "neg_ok": ok,
                }
            )

    summary = {
        "testset": str(TESTSET.relative_to(ROOT)),
        "embedder": getattr(embedder, "model_name", "?"),
        "n_positive_queries": n_pos,
        "n_negative_queries": n_neg,
        "recall@1": round(hits_at[1] / n_pos, 4) if n_pos else None,
        "recall@3": round(hits_at[3] / n_pos, 4) if n_pos else None,
        "recall@5": round(hits_at[5] / n_pos, 4) if n_pos else None,
        "mrr": round(mrr_sum / n_pos, 4) if n_pos else None,
        "neg_ok_rate": round(neg_ok / n_neg, 4) if n_neg else None,
        "index_n_metas": len(metas),
    }

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(
        json.dumps({"summary": summary, "details": details[:80]}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("=== eval_retrieval (testset_v1_retrieval) ===")
    for k, v in summary.items():
        print(f"  {k}: {v}")
    print(f"Đã ghi {REPORT}")

    miss = [d for d in details if d.get("type") == "positive" and not d.get("rank_first_gold")]
    if miss:
        print(f"\nMiss @5 ({len(miss)} mẫu):")
        for d in miss[:10]:
            print(f"  Q: {d['question']}")
            print(f"    gold={d['gold']} top={d['top5']}")


if __name__ == "__main__":
    main()
