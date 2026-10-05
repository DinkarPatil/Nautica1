"""Unit tests for cause attribution weight math."""

from __future__ import annotations

from types import SimpleNamespace

from app.domains.voyage.attribution import (
    _compute_weights_from_eta_series,
    _normalize_to_100,
)


def _snap(delta: int, cause: str | None = None):
    return SimpleNamespace(delta_min_from_prev=delta, cause=cause)


def test_empty_series_returns_fallback():
    assert _compute_weights_from_eta_series([]) == {
        "weather": 40, "congestion": 30, "speed": 20, "routing": 10
    }


def test_single_cause_dominates():
    out = _compute_weights_from_eta_series([_snap(60, "weather"), _snap(0, "speed")])
    assert out["weather"] == 100
    assert out["speed"] == 0


def test_multiple_causes_proportional():
    out = _compute_weights_from_eta_series([_snap(40, "weather"), _snap(60, "congestion")])
    assert out["weather"] == 40
    assert out["congestion"] == 60


def test_negative_deltas_ignored():
    out = _compute_weights_from_eta_series([_snap(-30, "weather"), _snap(60, "congestion")])
    # negatives don't count
    assert out["weather"] == 0
    assert out["congestion"] == 100


def test_unknown_cause_collapses_to_routing():
    out = _compute_weights_from_eta_series([_snap(50, "moon"), _snap(50, "speed")])
    assert out["routing"] == 50
    assert out["speed"] == 50


def test_normalize_to_100_adds_diff_to_largest():
    out = _normalize_to_100({"weather": 33, "congestion": 33, "speed": 33, "routing": 0})
    assert sum(out.values()) == 100
