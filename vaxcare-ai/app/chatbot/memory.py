from __future__ import annotations

import logging
import threading
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class Turn:
    role: str  # "user" | "assistant"
    content: str
    intent: str | None = None
    ts: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        return {
            "role": self.role,
            "content": self.content,
            "intent": self.intent,
            "ts": self.ts,
        }


@dataclass
class SessionMemory:
    session_id: str
    turns: deque[Turn] = field(default_factory=deque)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    # Accumulated soft context extracted across turns (age, vaccines mentioned…)
    soft_context: dict[str, Any] = field(default_factory=dict)

    def add(self, role: str, content: str, intent: str | None = None) -> None:
        self.turns.append(Turn(role=role, content=content, intent=intent))
        max_turns = getattr(settings, "chat_memory_max_turns", 8) * 2  # user+assistant
        while len(self.turns) > max_turns:
            self.turns.popleft()
        self.updated_at = time.time()

    def history_for_prompt(self, max_pairs: int | None = None) -> list[dict[str, str]]:
        """Return list of {role, content} suitable for chat prompts (oldest first)."""
        pairs = max_pairs or getattr(settings, "chat_memory_max_turns", 8)
        recent = list(self.turns)[-(pairs * 2) :]
        return [{"role": t.role, "content": t.content} for t in recent]

    def last_user_message(self) -> str | None:
        for t in reversed(self.turns):
            if t.role == "user":
                return t.content
        return None


    def merge_soft_context(self, entities: dict[str, Any] | None) -> None:
        if not entities:
            return
        if entities.get("age_years") is not None:
            self.soft_context["age_years"] = entities["age_years"]
            if entities.get("age_source") in (None, "user_message"):
                self.soft_context["age_source"] = entities.get("age_source") or "user_message"
                self.soft_context["age_confirmed"] = True
        if entities.get("age_months") is not None:
            self.soft_context["age_months"] = entities["age_months"]
        if entities.get("age_source"):
            self.soft_context["age_source"] = entities["age_source"]
        if entities.get("age_confirmed") is not None:
            self.soft_context["age_confirmed"] = bool(entities["age_confirmed"])
        if entities.get("subject"):
            self.soft_context["subject"] = entities["subject"]
        if entities.get("awaiting_age_confirm") is not None:
            self.soft_context["awaiting_age_confirm"] = bool(entities["awaiting_age_confirm"])
        vids = entities.get("vaccine_ids")
        if vids:
            prev = self.soft_context.get("vaccine_ids") or []
            merged = list(dict.fromkeys(list(prev) + list(vids)))
            self.soft_context["vaccine_ids"] = merged[:8]
        vaccines = entities.get("vaccines") or []
        if vaccines:
            self.soft_context["last_vaccines"] = vaccines[:5]

    def set_soft(self, **kwargs: Any) -> None:
        for k, v in kwargs.items():
            if v is not None:
                self.soft_context[k] = v



class MemoryStore:
    """Thread-safe in-process session memory with simple TTL eviction."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._sessions: dict[str, SessionMemory] = {}

    def get(self, session_id: str) -> SessionMemory:
        with self._lock:
            self._evict_expired()
            mem = self._sessions.get(session_id)
            if mem is None:
                mem = SessionMemory(session_id=session_id)
                self._sessions[session_id] = mem
            return mem

    def add_turn(
        self,
        session_id: str,
        role: str,
        content: str,
        intent: str | None = None,
    ) -> SessionMemory:
        with self._lock:
            mem = self.get(session_id)
            mem.add(role, content, intent=intent)
            return mem

    def update_soft_context(self, session_id: str, entities: dict[str, Any] | None) -> None:
        with self._lock:
            mem = self.get(session_id)
            mem.merge_soft_context(entities)

    def clear(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def stats(self) -> dict[str, Any]:
        with self._lock:
            return {
                "active_sessions": len(self._sessions),
                "max_turns_per_session": getattr(settings, "chat_memory_max_turns", 8),
            }

    def _evict_expired(self) -> None:
        ttl = getattr(settings, "chat_memory_ttl_sec", 3600)
        if ttl <= 0:
            return
        now = time.time()
        expired = [
            sid
            for sid, mem in self._sessions.items()
            if (now - mem.updated_at) > ttl
        ]
        for sid in expired:
            del self._sessions[sid]
        if expired:
            logger.debug("Evicted %d expired chat sessions", len(expired))

_store: MemoryStore | None = None
_store_lock = threading.Lock()


def get_memory_store() -> MemoryStore:
    global _store
    if _store is None:
        with _store_lock:
            if _store is None:
                _store = MemoryStore()
    return _store
