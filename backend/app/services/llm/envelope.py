"""Helper to attach `_meta` to AI-derived payloads."""

from __future__ import annotations

from typing import Any


def with_meta(payload: dict[str, Any], meta: dict[str, Any]) -> dict[str, Any]:
    out = dict(payload)
    out["_meta"] = meta
    return out
