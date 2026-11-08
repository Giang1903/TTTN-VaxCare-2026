from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """
    Backend ưu tiên:
      1. ollama      – HTTP tới Ollama local (khuyến nghị demo/prod nhẹ)
      2. llama_cpp   – GGUF qua llama-cpp-python
      3. transformers– HuggingFace Qwen (nặng, cần GPU)
      4. mock        – chỉ khi LLM_BACKEND=mock hoặc mọi backend thật đều lỗi
    """

    def __init__(
        self,
        backend: str | None = None,
        model_name: str | None = None,
        timeout: float | None = None,
    ):
        self.backend = (backend or settings.llm_backend or "ollama").lower().strip()
        self.model_name = model_name or settings.llm_model_name
        self.timeout = float(
            timeout
            if timeout is not None
            else getattr(settings, "llm_timeout_sec", 60.0) or 60.0
        )
        self.ollama_base = (
            getattr(settings, "ollama_base_url", None)
            or os.getenv("OLLAMA_BASE_URL")
            or "http://127.0.0.1:11434"
        ).rstrip("/")
        self.gguf_path = getattr(settings, "llm_gguf_path", None) or os.getenv(
            "LLM_GGUF_PATH", ""
        )
        self._llama_model = None
        self._hf_model = None
        self._hf_tokenizer = None

        if self.backend == "mock":
            logger.warning(
                "LLM_BACKEND=mock – câu trả lời không dùng mô hình ngôn ngữ thật. "
                "Đặt LLM_BACKEND=ollama (hoặc llama_cpp) để demo production."
            )

    def generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 512,
        temperature: float = 0.2,
    ) -> str:
        try:
            if self.backend == "mock":
                return self._mock_generate(messages)
            if self.backend in ("ollama",):
                return self._ollama_generate(messages, max_tokens, temperature)
            if self.backend in ("llama_cpp", "llamacpp", "llama.cpp"):
                return self._llama_cpp_generate(messages, max_tokens, temperature)
            if self.backend in ("transformers", "hf", "huggingface"):
                return self._transformers_generate(messages, max_tokens, temperature)
            logger.warning("Unknown LLM backend %s – fallback mock", self.backend)
            return self._mock_generate(messages)
        except Exception as e:
            logger.error(
                "LLM generate failed (backend=%s): %s – fallback mock để tránh treo/500",
                self.backend,
                e,
            )
            return self._mock_generate(messages)

    def health_check(self) -> dict[str, Any]:
        """Kiểm tra backend có sẵn không (dùng cho /health)."""
        info: dict[str, Any] = {
            "backend": self.backend,
            "model": self.model_name,
            "ok": False,
            "detail": "",
        }
        if self.backend == "mock":
            info["ok"] = True
            info["detail"] = "mock mode (không gọi model thật)"
            return info
        if self.backend == "ollama":
            try:
                import httpx

                with httpx.Client(timeout=5.0) as client:
                    r = client.get(f"{self.ollama_base}/api/tags")
                    r.raise_for_status()
                    names = [m.get("name", "") for m in (r.json().get("models") or [])]
                    info["available_models"] = names[:20]
                    matched = any(
                        self.model_name == n
                        or self.model_name in n
                        or n.startswith(self.model_name.split(":")[0])
                        for n in names
                    )
                    info["ok"] = bool(names)
                    info["model_present"] = matched
                    info["detail"] = (
                        f"Ollama reachable, model_present={matched}"
                        if names
                        else "Ollama reachable but no models pulled"
                    )
            except Exception as e:
                info["detail"] = f"Ollama unreachable: {e}"
            return info
        if self.backend in ("llama_cpp", "llamacpp", "llama.cpp"):
            path = Path(self.gguf_path) if self.gguf_path else None
            info["ok"] = bool(path and path.exists())
            info["detail"] = (
                f"GGUF path={path}" if path else "LLM_GGUF_PATH chưa cấu hình"
            )
            return info
        info["detail"] = f"backend {self.backend} – kiểm tra runtime khi generate"
        return info

    def _mock_generate(self, messages: list[dict[str, str]]) -> str:
        """Deterministic fallback khi chưa có model / backend lỗi và backend=mock."""
        user = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user = m.get("content") or ""
                break
        snippet = ""
        for key in (
            "Kết quả rule engine:",
            "Kết quả đối chiếu hồ sơ:",
            "Ngữ cảnh truy xuất:",
            "Kết quả sàng lọc sơ bộ:",
        ):
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
        import httpx

        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "top_p": 0.9,
                "top_k": 40,
                "repeat_penalty": 1.25,
                "repeat_last_n": 128,
                "stop": [
                    "<|im_end|>",
                    "<|endoftext|>",
                    "\n\n\n",
                    "User:",
                    "Human:",
                    "Người dùng:",
                ],
            },
        }
        url = f"{self.ollama_base}/api/chat"
        with httpx.Client(timeout=self.timeout) as client:
            r = client.post(url, json=payload)
            if r.status_code == 404:
                raise RuntimeError(
                    f"Ollama model '{self.model_name}' chưa được pull. "
                    f"Chạy: ollama pull {self.model_name}"
                )
            r.raise_for_status()
            data = r.json()
            content = (data.get("message") or {}).get("content") or ""
            if not content.strip():
                raise RuntimeError("Ollama trả về content rỗng")
            return content.strip()

    def _llama_cpp_generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        try:
            from llama_cpp import Llama
        except ImportError as e:
            raise RuntimeError(
                "llama-cpp-python chưa cài. pip install llama-cpp-python"
            ) from e

        if self._llama_model is None:
            path = Path(self.gguf_path) if self.gguf_path else None
            if not path or not path.exists():
                candidates = list(
                    (settings.model_dir / "llm").glob("*.gguf")
                ) if (settings.model_dir / "llm").exists() else []
                if not candidates:
                    raise RuntimeError(
                        "Không tìm thấy file GGUF. Đặt LLM_GGUF_PATH=.../model.gguf "
                        "hoặc bỏ file vào models/llm/"
                    )
                path = candidates[0]
            logger.info("Loading GGUF from %s", path)
            self._llama_model = Llama(
                model_path=str(path),
                n_ctx=4096,
                n_threads=max(1, (os.cpu_count() or 4) // 2),
                verbose=False,
            )

        prompt_parts: list[str] = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content") or ""
            if role == "system":
                prompt_parts.append(f"<|im_start|>system\n{content}<|im_end|>")
            elif role == "user":
                prompt_parts.append(f"<|im_start|>user\n{content}<|im_end|>")
            else:
                prompt_parts.append(f"<|im_start|>assistant\n{content}<|im_end|>")
        prompt_parts.append("<|im_start|>assistant\n")
        prompt = "\n".join(prompt_parts)

        out = self._llama_model(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            repeat_penalty=1.25,
            top_p=0.9,
            top_k=40,
            stop=["<|im_end|>", "<|endoftext|>", "\n\n\n"],
        )
        text = out["choices"][0]["text"] if out.get("choices") else ""
        return (text or "").strip()

    def _transformers_generate(
        self,
        messages: list[dict[str, str]],
        max_tokens: int,
        temperature: float,
    ) -> str:
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
        except ImportError as e:
            raise RuntimeError(
                "transformers/torch chưa cài đủ cho backend transformers"
            ) from e

        if self._hf_model is None:
            model_id = self.model_name or "Qwen/Qwen2.5-1.5B-Instruct"
            logger.info("Loading HF model %s", model_id)
            self._hf_tokenizer = AutoTokenizer.from_pretrained(
                model_id, trust_remote_code=True
            )
            self._hf_model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto",
                trust_remote_code=True,
            )

        assert self._hf_tokenizer is not None and self._hf_model is not None
        text = self._hf_tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self._hf_tokenizer(text, return_tensors="pt").to(self._hf_model.device)
        with torch.no_grad():
            generated = self._hf_model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                do_sample=temperature > 0,
                temperature=max(temperature, 1e-5),
                top_p=0.9,
                top_k=40,
                repetition_penalty=1.25,
                pad_token_id=self._hf_tokenizer.eos_token_id,
            )
        new_tokens = generated[0][inputs["input_ids"].shape[-1] :]
        return self._hf_tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


_default_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client


def reset_llm_client() -> None:
    """Cho phép test/reload khi đổi env."""
    global _default_client
    _default_client = None
