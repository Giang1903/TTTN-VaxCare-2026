from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(
        self,
        backend: str | None = None,
        model_name: str | None = None,
        timeout: float = 60.0,
    ):
        self.backend = (backend or settings.llm_backend or "mock").lower()
        self.model_name = model_name or settings.llm_model_name
        self.timeout = timeout

    def generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 512,
        temperature: float = 0.2,
    ) -> str:
        if self.backend == "mock":
            return self._mock_generate(messages)
        if self.backend in ("ollama",):
            return self._ollama_generate(messages, max_tokens, temperature)
        if self.backend in ("llama_cpp", "llamacpp", "llama.cpp"):
            return self._llama_cpp_generate(messages, max_tokens, temperature)
        logger.warning("Unknown LLM backend %s – fallback mock", self.backend)
        return self._mock_generate(messages)

    def _mock_generate(self, messages: list[dict[str, str]]) -> str:
        """Trả lời deterministic từ user message cuối (dùng khi chưa có GPU/model)."""
        user = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user = m.get("content") or ""
                break
        snippet = ""
        for key in ("Kết quả rule engine:", "Kết quả đối chiếu hồ sơ:", "Ngữ cảnh truy xuất:"):
            if key in user:
                start = user.find(key)
                snippet = user[start : start + 600]
                break
        if not snippet:
            snippet = user[:400]

        return (
            "Dựa trên thông tin hiện có:\n"
            f"{snippet.strip()}\n\n"
            "Nội dung mang tính tham khảo theo lịch và tài liệu đã nạp. "
            "Vui lòng xác nhận lại với nhân viên y tế / cơ sở tiêm chủng trước khi quyết định."
        )

    def _ollama_generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        try:
            import httpx

            payload = {
                "model": self.model_name,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            }
            with httpx.Client(timeout=self.timeout) as client:
                r = client.post("http://127.0.0.1:11434/api/chat", json=payload)
                r.raise_for_status()
                data = r.json()
                return (data.get("message") or {}).get("content") or ""
        except Exception as e:
            logger.error("Ollama call failed: %s", e)
            return self._mock_generate(messages)

    def _llama_cpp_generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        logger.warning("llama.cpp backend chưa cấu hình – dùng mock")
        return self._mock_generate(messages)


_default_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client
