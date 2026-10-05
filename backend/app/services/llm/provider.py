"""AIProvider protocol and ProviderResult.

The interface deliberately stays narrow: structured JSON in, structured JSON out.
Free-form text generation is a special case (`schema=None`) that we use sparingly.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Protocol


@dataclass(slots=True)
class ProviderResult:
    parsed: dict
    raw: dict | None
    model: str
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]
    latency_ms: float
    error_code: Optional[str] = None


class AIProvider(Protocol):
    name: str

    async def generate_json(
        self,
        *,
        prompt: str,
        schema: dict[str, Any] | None,
        model: str | None = None,
        system: str | None = None,
    ) -> ProviderResult: ...
