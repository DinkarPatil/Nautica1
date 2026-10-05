"""Prompt registry + LLM facade.

Loads markdown prompt templates by `name + version`, executes them through the
selected provider, persists the call to `ai_calls`, and stamps `_meta` onto
the parsed payload so callers can pass the metadata to the frontend.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ...config import get_settings
from .models import AICall
from .provider import AIProvider, ProviderResult


log = logging.getLogger("llm")

_PROMPT_DIRS: list[Path] = []


def register_prompt_dir(d: Path) -> None:
    if d not in _PROMPT_DIRS:
        _PROMPT_DIRS.append(d)


def _auto_register_default_dirs() -> None:
    """Fallback: ensure the well-known prompt dirs are registered.

    Called lazily from `_load_prompt` so unit tests and direct imports work
    without going through `app.main.create_app()`.
    """
    if _PROMPT_DIRS:
        return
    here = Path(__file__).resolve().parent.parent.parent  # .../app
    for sub in ("domains/voyage/prompts", "domains/agi/prompts"):
        d = here / sub
        if d.exists():
            _PROMPT_DIRS.append(d)


def _load_prompt(name: str, version: str) -> str:
    """Load a prompt template like `voyage_brief.v1` from any registered dir.

    Returns the raw markdown body. Caller is responsible for `.format(**vars)`.
    """
    _auto_register_default_dirs()
    fname = f"{name}.{version}.md"
    for d in _PROMPT_DIRS:
        p = d / fname
        if p.exists():
            return p.read_text(encoding="utf-8")
    raise FileNotFoundError(f"Prompt not found: {fname}. Registered dirs: {_PROMPT_DIRS}")


def _hash_prompt(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


_provider_singleton: AIProvider | None = None


def get_provider() -> AIProvider:
    global _provider_singleton
    if _provider_singleton is not None:
        return _provider_singleton

    settings = get_settings()
    if settings.resolved_provider == "vertex":
        from .vertex import VertexProvider
        _provider_singleton = VertexProvider()
    else:
        from .stub import StubProvider
        _provider_singleton = StubProvider()
    return _provider_singleton


def reset_provider_for_tests() -> None:
    global _provider_singleton
    _provider_singleton = None


async def call_llm(
    db: AsyncSession,
    *,
    prompt_name: str,
    prompt_version: str,
    prompt_body: str,
    schema: dict[str, Any] | None = None,
    model: str | None = None,
    system: str | None = None,
    note: str | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Run a prompt and return (parsed_payload, _meta).

    Always persists an `ai_calls` row (whether success or failure).
    """
    provider = get_provider()
    settings = get_settings()
    chosen_model = model or settings.GEMINI_MODEL

    tagged_system = f"[[prompt:{prompt_name}.{prompt_version}]]\n{system or ''}".strip()

    result: ProviderResult = await provider.generate_json(
        prompt=prompt_body,
        schema=schema,
        model=chosen_model,
        system=tagged_system,
    )

    status = "ok" if not result.error_code else "error"
    db.add(
        AICall(
            prompt_name=prompt_name,
            prompt_version=prompt_version,
            model=result.model,
            request_hash=_hash_prompt(prompt_body),
            latency_ms=result.latency_ms,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            status=status,
            error_code=result.error_code,
            raw_response=result.raw,
            parsed=result.parsed,
            note=note,
        )
    )
    await db.flush()

    meta = {
        "model": result.model,
        "promptVersion": f"{prompt_name}.{prompt_version}",
        "generatedAt": datetime.now(tz=timezone.utc).isoformat(),
        "stale": False,
        "provider": provider.name,
        "errorCode": result.error_code,
    }
    return result.parsed, meta


def render_prompt(name: str, version: str, **vars: Any) -> str:
    raw = _load_prompt(name, version)
    return raw.format(**vars)
