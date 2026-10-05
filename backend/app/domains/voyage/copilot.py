"""Voyage Setup Copilot — Vertex-backed suggestions for the create form."""

from __future__ import annotations

import json

from sqlalchemy.ext.asyncio import AsyncSession

from ...services.llm.registry import call_llm, render_prompt
from .schemas import CopilotOut, CopilotSuggestion, VoyageDraftIn


_SCHEMA = {
    "type": "object",
    "properties": {
        "suggestions": {
            "type": "array",
            "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {
                    "field": {"type": "string"},
                    "suggestedValue": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["field", "suggestedValue", "reason"],
            },
        },
        "nextQuestion": {"type": "string"},
    },
    "required": ["suggestions", "nextQuestion"],
}


_ALLOWED_FIELDS = {
    "shipName", "imo", "voyageType", "plannedArrival",
    "sensitivity", "alertPreference", "cargoPriority",
    "preferredRoute", "notes",
}


async def run_copilot(db: AsyncSession, draft: VoyageDraftIn) -> CopilotOut:
    draft_dict = draft.model_dump()
    # Remove nested origin/destination — we don't want to bias LLM into changing ports.
    draft_dict.pop("origin", None)
    draft_dict.pop("destination", None)

    body = render_prompt(
        "setup_copilot", "v1",
        draft_json=json.dumps(draft_dict, indent=2),
    )
    parsed, meta = await call_llm(
        db,
        prompt_name="setup_copilot",
        prompt_version="v1",
        prompt_body=body,
        schema=_SCHEMA,
        note=f"draft_ship={draft.shipName[:30]}",
    )

    suggestions = []
    for s in parsed.get("suggestions") or []:
        if not isinstance(s, dict):
            continue
        f = s.get("field")
        if f not in _ALLOWED_FIELDS:
            continue
        suggestions.append(
            CopilotSuggestion(
                field=f,
                suggestedValue=str(s.get("suggestedValue", "")).strip(),
                reason=str(s.get("reason", "")).strip(),
            )
        )

    return CopilotOut(
        suggestions=suggestions,
        nextQuestion=(parsed.get("nextQuestion") or "").strip() or None,
        _meta=meta,
    )
