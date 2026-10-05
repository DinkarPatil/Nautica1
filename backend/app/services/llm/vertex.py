"""Vertex AI Gemini provider via google-genai SDK.

We deliberately decode the service-account JSON ourselves and feed Credentials
to the client, so the keys remain in env vars (no on-disk file in dev).
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from google.oauth2 import service_account

from ...config import get_settings
from .provider import ProviderResult


log = logging.getLogger("vertex")


_SA_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


class VertexProvider:
    name = "vertex"

    def __init__(self) -> None:
        s = get_settings()
        if s.decoded_service_account is None:
            raise RuntimeError("VertexProvider requires a decoded service account.")
        self._creds = service_account.Credentials.from_service_account_info(
            s.decoded_service_account, scopes=_SA_SCOPES
        )
        self._project = s.GCP_PROJECT
        self._location = s.GCP_LOCATION
        self._default_model = s.GEMINI_MODEL
        self._timeout = s.LLM_REQUEST_TIMEOUT_S
        self._retries = s.LLM_MAX_RETRIES
        self._backoff = s.LLM_INITIAL_BACKOFF
        self._client = None  # lazy

    def _get_client(self):
        if self._client is None:
            from google import genai
            self._client = genai.Client(
                vertexai=True,
                project=self._project,
                location=self._location,
                credentials=self._creds,
            )
        return self._client

    async def generate_json(
        self,
        *,
        prompt: str,
        schema: dict[str, Any] | None,
        model: str | None = None,
        system: str | None = None,
    ) -> ProviderResult:
        from google.genai import types as gt

        client = self._get_client()
        chosen_model = model or self._default_model

        config_kwargs: dict[str, Any] = {
            "temperature": 0.2,
            "max_output_tokens": 1500,
        }
        if system:
            config_kwargs["system_instruction"] = system
        if schema is not None:
            config_kwargs["response_mime_type"] = "application/json"
            # google-genai accepts a dict schema directly under response_schema
            config_kwargs["response_schema"] = schema

        attempt = 0
        last_exc: Exception | None = None
        t0 = time.perf_counter()

        def _sync_call() -> Any:
            return client.models.generate_content(
                model=chosen_model,
                contents=prompt,
                config=gt.GenerateContentConfig(**config_kwargs),
            )

        while attempt <= self._retries:
            try:
                resp = await asyncio.wait_for(
                    asyncio.to_thread(_sync_call),
                    timeout=self._timeout,
                )
                latency = (time.perf_counter() - t0) * 1000.0
                text = resp.text or ""
                try:
                    parsed = json.loads(text) if text else {}
                except json.JSONDecodeError as exc:
                    if attempt < self._retries:
                        attempt += 1
                        await asyncio.sleep(self._backoff * (2 ** (attempt - 1)))
                        continue
                    return ProviderResult(
                        parsed={},
                        raw={"text": text},
                        model=chosen_model,
                        prompt_tokens=None,
                        completion_tokens=None,
                        latency_ms=latency,
                        error_code=f"json_decode: {exc}",
                    )
                usage = getattr(resp, "usage_metadata", None)
                pt = getattr(usage, "prompt_token_count", None) if usage else None
                ct = getattr(usage, "candidates_token_count", None) if usage else None
                return ProviderResult(
                    parsed=parsed if isinstance(parsed, dict) else {"value": parsed},
                    raw={"text": text},
                    model=chosen_model,
                    prompt_tokens=pt,
                    completion_tokens=ct,
                    latency_ms=latency,
                )
            except Exception as exc:  # noqa: BLE001 — broad to retry transient
                last_exc = exc
                msg = str(exc)
                # Hard 4xx — fail fast
                if any(code in msg for code in ("403", "404", "PERMISSION_DENIED", "INVALID_ARGUMENT")):
                    break
                if attempt >= self._retries:
                    break
                attempt += 1
                await asyncio.sleep(self._backoff * (2 ** (attempt - 1)))

        latency = (time.perf_counter() - t0) * 1000.0
        log.warning("vertex_call_failed", extra={"err": str(last_exc), "model": chosen_model})
        return ProviderResult(
            parsed={},
            raw=None,
            model=chosen_model,
            prompt_tokens=None,
            completion_tokens=None,
            latency_ms=latency,
            error_code=f"provider_error: {last_exc}",
        )
