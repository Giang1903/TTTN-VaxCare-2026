from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_retriever = None
_intent_clf = None
_loaded = False


def get_retriever() -> Any | None:
    global _retriever
    if _retriever is not None:
        return _retriever
    try:
        if not settings.faiss_index_path.exists():
            logger.info("FAISS index not found – retrieval disabled")
            return None
        from app.chatbot.rag.embedder import Embedder
        from app.chatbot.rag.vector_store import VectorStore
        from app.chatbot.rag.retriever import Retriever

        embedder = Embedder(model_name=settings.embedding_model_name)
        store = VectorStore(
            index_path=settings.faiss_index_path,
            meta_path=settings.chunks_meta_path,
        )
        _retriever = Retriever(
            embedder=embedder,
            store=store,
            top_k=settings.retrieval_top_k,
            min_score=settings.retrieval_min_score,
        )
        logger.info("Retriever ready")
    except Exception as e:
        logger.warning("Cannot init retriever: %s", e)
        _retriever = None
    return _retriever


def load_all() -> dict[str, bool]:
    """Gọi khi startup (lifespan)."""
    global _loaded
    status = {
        "retriever": get_retriever() is not None,
        "intent_model": settings.model_dir.joinpath(settings.intent_model_name).exists(),
    }
    _loaded = True
    logger.info("model_loader status: %s", status)
    return status
