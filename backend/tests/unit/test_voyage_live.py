"""Unit tests for the deterministic live snapshot synthesis."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.domains.voyage.live import (
    _haversine_nm,
    _interp_along,
    _phase_for,
    _risk_band,
    _route_total_nm,
    compute_live_snapshot,
)


def test_haversine_known_distance():
    # Algeciras (36.14, -5.45) -> Rotterdam (51.92, 4.48): great-circle ~1038 nm
    nm = _haversine_nm(36.14, -5.45, 51.92, 4.48)
    assert 950 < nm < 1150


def test_route_total_is_sum_of_segments():
    route = [
        {"lat": 0, "lon": 0},
        {"lat": 0, "lon": 1},
        {"lat": 0, "lon": 2},
    ]
    total = _route_total_nm(route)
    # 1° of longitude near the equator ≈ 60 nm; total ~120 nm.
    assert 100 < total < 140


def test_interp_along_endpoints():
    route = [{"lat": 0, "lon": 0}, {"lat": 0, "lon": 10}]
    pos0, _ = _interp_along(route, 0.0)
    pos1, _ = _interp_along(route, 1.0)
    assert pos0.lat == 0 and pos0.lon == 0
    assert pos1.lat == 0 and abs(pos1.lon - 10) < 1e-6


def test_phase_buckets():
    assert _phase_for(2) == "departure"
    assert _phase_for(50) == "in_transit"
    assert _phase_for(90) == "approach"
    assert _phase_for(98) == "docking"


def test_risk_band_thresholds():
    assert _risk_band(10) == "low"
    assert _risk_band(50) == "medium"
    assert _risk_band(80) == "high"


@pytest.mark.asyncio
async def test_compute_live_snapshot_for_synthetic_voyage(monkeypatch):
    """Don't hit the real network — patch the weather adapter."""
    from app.domains.voyage import live as live_mod
    from app.services.adapters.open_meteo import WeatherSnapshot

    async def fake_weather(lat, lon):
        return WeatherSnapshot(15.0, 200.0, None, "fixture")

    monkeypatch.setattr(live_mod, "get_weather", fake_weather)

    # Synthetic voyage with departure 1 hour ago, planned 4-hour duration
    now = datetime.now(tz=timezone.utc)
    voyage = SimpleNamespace(
        id="v_test",
        planned_departure=(now - timedelta(hours=1)).isoformat(),
        planned_arrival=(now + timedelta(hours=3)).isoformat(),
        actual_departure=(now - timedelta(hours=1)).isoformat(),
        status="in_transit",
        route_planned=[
            {"lat": 36.0, "lon": -5.0},
            {"lat": 40.0, "lon": 0.0},
            {"lat": 50.0, "lon": 5.0},
        ],
        origin_lat=36.0, origin_lon=-5.0,
        destination_lat=50.0, destination_lon=5.0,
        cargo_priority="high",
    )
    snap = await compute_live_snapshot(None, voyage)
    assert snap.voyageId == "v_test"
    assert 0 <= snap.progressPct <= 100
    assert snap.phase in ("departure", "in_transit", "approach", "docking")
    assert snap.riskBand in ("low", "medium", "high")
    assert snap.distanceTotalNm > 0
