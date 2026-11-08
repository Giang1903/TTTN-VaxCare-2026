from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_retriever: Any | None = None
_intent_ready: bool = False
_loaded: bool = False
_status: dict[str, Any] = {}


def get_retriever() -> Any | None:
    global _retriever
    if _retriever is not None:
        return _retriever
    try:
        if not settings.faiss_index_path.exists():
            logger.info("FAISS index not found – retrieval disabled")
            return None
        from app.chatbot.rag.embedder import load_embedder
        from app.chatbot.rag.vector_store import VectorStore
        from app.chatbot.rag.retriever import Retriever

        metas = []
        try:
            import json

            metas = json.loads(settings.chunks_meta_path.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Cannot load chunks_meta: %s", e)

        texts = [m.get("text") or "" for m in metas] if metas else None

        embedder = load_embedder(
            model_name=settings.embedding_model_name,
            prefer_bge=True,
            corpus_for_tfidf=texts,
        )
        store = VectorStore.load(settings.faiss_index_path, settings.chunks_meta_path)
        if getattr(embedder, "dim", None) and store.dim and embedder.dim != store.dim:
            logger.warning(
                "Embedder dim=%s != index dim=%s – tắt retriever (cần BGE-M3)",
                embedder.dim,
                store.dim,
            )
            return None

        bm25 = None
        bm25_ok = False
        try:
            from app.chatbot.rag.bm25 import BM25Store

            if texts:
                bm25 = BM25Store(texts, metas=metas)
                bm25_ok = True
        except Exception as e:
            logger.warning("BM25 unavailable (hybrid off): %s", e)

        _retriever = Retriever(
            embedder=embedder,
            store=store,
            bm25=bm25,
            top_k=settings.retrieval_top_k,
            min_score=settings.retrieval_min_score,
            score_margin=getattr(settings, "retrieval_score_margin", 0.10),
            use_rrf=True,
        )
        logger.info(
            "Retriever ready (embedder=%s bm25=%s min_score=%s margin=%s n_chunks=%s)",
            getattr(embedder, "model_name", "?"),
            bm25_ok,
            settings.retrieval_min_score,
            getattr(settings, "retrieval_score_margin", 0.10),
            len(metas) if metas else 0,
        )
    except Exception as e:
        logger.warning("Cannot init retriever: %s", e)
        _retriever = None
    return _retriever


def get_status() -> dict[str, Any]:
    return dict(_status)


def is_loaded() -> bool:
    return _loaded


def load_all() -> dict[str, Any]:
    """Gọi một lần khi startup."""
    global _loaded, _intent_ready, _status

    intent_path = settings.model_dir / settings.intent_model_name
    _intent_ready = intent_path.exists()

    retriever_ok = False
    try:
        retriever_ok = get_retriever() is not None
    except Exception as e:
        logger.warning("Retriever load skipped: %s", e)

    llm_ok = None
    llm_detail = ""
    try:
        from app.chatbot.llm.client import get_llm_client

        h = get_llm_client().health_check()
        llm_ok = bool(h.get("ok"))
        llm_detail = str(h.get("detail") or "")
    except Exception as e:
        llm_ok = False
        llm_detail = str(e)

    _status = {
        "loaded": True,
        "intent_model": _intent_ready,
        "intent_model_path": str(intent_path),
        "faiss_index": settings.faiss_index_path.exists(),
        "retriever": retriever_ok,
        "llm_backend": settings.llm_backend,
        "llm_ok": llm_ok,
        "llm_detail": llm_detail,
        "retrieval_min_score": settings.retrieval_min_score,
        "retrieval_score_margin": getattr(settings, "retrieval_score_margin", 0.10),
        "chatbot_enabled": settings.chatbot_enabled,
    }
    _loaded = True
    logger.info("model_loader status: %s", _status)
    return _status
