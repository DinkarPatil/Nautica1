"""Unit tests for the deterministic stub provider."""

from __future__ import annotations

import pytest

from app.services.llm.stub import StubProvider


@pytest.mark.asyncio
async def test_voyage_brief_shape():
    p = StubProvider()
    res = await p.generate_json(
        prompt="anything",
        schema=None,
        system="[[prompt:voyage_brief.v1]]",
    )
    assert res.error_code is None
    parsed = res.parsed
    for k in ("whatIsHappening", "whatChanged", "whyETAMoved", "riskBand", "recommendation", "riskFactors"):
        assert k in parsed
    assert parsed["riskBand"] in ("low", "medium", "high")
    assert isinstance(parsed["riskFactors"], list) and len(parsed["riskFactors"]) >= 1


@pytest.mark.asyncio
async def test_fleet_analysis_returns_decisions_array():
    p = StubProvider()
    res = await p.generate_json(
        prompt="anything",
        schema=None,
        system="[[prompt:fleet_analysis.v1]]",
    )
    assert "decisions" in res.parsed
    assert isinstance(res.parsed["decisions"], list)
    assert all("title" in d and "category" in d for d in res.parsed["decisions"])


@pytest.mark.asyncio
async def test_unknown_tag_falls_back_to_echo():
    p = StubProvider()
    res = await p.generate_json(prompt="hello", schema=None, system=None)
    assert res.parsed.get("_stub") is True
