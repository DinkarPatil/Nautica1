"""Deterministic stub provider — used in tests and when AI_PROVIDER=stub.

It branches on `prompt_name` (passed via the registry, threaded through `system`
prefix tag `[[prompt:<name>.<version>]]`) so each module can rely on a known
canned shape that matches its real schema.
"""

from __future__ import annotations

import hashlib
import re
import time
from typing import Any

from .provider import ProviderResult


_PROMPT_TAG_RE = re.compile(r"\[\[prompt:([^\]]+)\]\]")


def _detect_prompt(system: str | None, prompt: str) -> str:
    for source in (system or "", prompt):
        m = _PROMPT_TAG_RE.search(source)
        if m:
            return m.group(1)
    return ""


def _hash(s: str) -> int:
    return int(hashlib.sha256(s.encode("utf-8")).hexdigest()[:8], 16)


class StubProvider:
    name = "stub"

    async def generate_json(
        self,
        *,
        prompt: str,
        schema: dict[str, Any] | None,
        model: str | None = None,
        system: str | None = None,
    ) -> ProviderResult:
        t0 = time.perf_counter()
        tag = _detect_prompt(system, prompt)
        h = _hash(prompt)

        parsed: dict[str, Any]

        if tag.startswith("voyage_brief"):
            parsed = {
                "whatIsHappening": "Vessel is en route under nominal conditions; ETA is holding within tolerance.",
                "whatChanged": "Speed eased slightly during the last 4h due to winds picking up off the planned track.",
                "whyETAMoved": "Combined effect of wind from 240° at BF5 and a small congestion delay near transit chokepoint.",
                "riskBand": "medium",
                "recommendation": "Hold current routing. Monitor congestion forecast at next chokepoint.",
                "riskFactors": [
                    {"key": "weather", "value": 60},
                    {"key": "traffic", "value": 45},
                    {"key": "routing", "value": 30},
                ],
            }
        elif tag.startswith("voyage_insight"):
            parsed = {
                "insight": (
                    "The voyage absorbed weather and congestion impact within tolerance. "
                    "Primary cause of slip was wind-driven slowdown. Routing decisions held up."
                )
            }
        elif tag.startswith("voyage_chat"):
            parsed = {
                "answer": "Based on current telemetry, ETA is holding. Weather is the dominant driver.",
                "citations": [{"kind": "live"}, {"kind": "events"}],
            }
        elif tag.startswith("voyage_conclusion"):
            parsed = {
                "aiConclusion": (
                    "Voyage completed within risk tolerance. Recommend retaining current routing for repeat sailings; "
                    "flag the chokepoint sector for an advisory window."
                )
            }
        elif tag.startswith("attribution_notes"):
            parsed = {
                "factors": [
                    {"key": "weather", "weightPct": 50, "note": "Wind-driven slowdown sector E"},
                    {"key": "congestion", "weightPct": 30, "note": "Queue at transit chokepoint"},
                    {"key": "speed", "weightPct": 15, "note": "Voluntary speed reduction"},
                    {"key": "routing", "weightPct": 5, "note": "Minor track adjustment"},
                ]
            }
        elif tag.startswith("fleet_analysis"):
            kinds = ["Risk Warning", "Route Optimization", "Trade Opportunity", "Port Advisory"]
            parsed = {
                "decisions": [
                    {
                        "title": f"Stub recommendation #{(h + i) % 100}",
                        "category": kinds[i % len(kinds)],
                        "summary": "Stub-generated recommendation derived from current fleet state.",
                        "reasoning": "Heuristic synthesis (stub provider).",
                        "confidence": 80 - (i * 4),
                        "priority": ["high", "medium", "low"][i % 3],
                        "affectedVessels": [],
                        "affectedPorts": [],
                        "estimatedSaving": "n/a",
                    }
                    for i in range(3)
                ]
            }
        elif tag.startswith("sanctions_explain"):
            parsed = {"explanation": "Match details correspond to the queried entity per the source list."}
        elif tag.startswith("voyage_assistant_preview"):
            parsed = {
                "summary": "Draft looks consistent. Route distance and schedule are within typical range.",
                "riskBand": "low",
                "riskFactors": [
                    {"key": "weather", "value": 30},
                    {"key": "traffic", "value": 25},
                    {"key": "routing", "value": 15},
                ],
            }
        else:
            parsed = {"_stub": True, "echo": prompt[:200], "tag": tag}

        latency = (time.perf_counter() - t0) * 1000.0
        return ProviderResult(
            parsed=parsed,
            raw={"stub": True, "tag": tag},
            model=model or "stub",
            prompt_tokens=len(prompt.split()),
            completion_tokens=sum(len(str(v).split()) for v in parsed.values()) if isinstance(parsed, dict) else 0,
            latency_ms=latency,
        )
