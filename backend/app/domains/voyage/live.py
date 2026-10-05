"""Deterministic live snapshot synthesis.

Given a voyage with a planned route and an actualDeparture, we derive a position
along the great-circle line by blending elapsed time with planned duration.
We perturb with a small wind-derived slowdown so subsequent snapshots show
realistic ETA drift. The output matches the frontend's `VoyageLiveSnapshot`.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.ext.asyncio import AsyncSession

from ...services.adapters.open_meteo import get_weather
from .schemas import (
    Coordinate,
    RiskBand,
    VoyageLiveSnapshot,
    VoyagePhase,
)


# ----- helpers -----


def _parse_iso(s: str | None) -> datetime | None:
    if not s:
        return None
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None
    # Always return tz-aware in UTC so arithmetic with `now` never raises.
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _haversine_nm(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    R_NM = 3440.065  # earth radius in nautical miles
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dphi = math.radians(b_lat - a_lat)
    dlam = math.radians(b_lon - a_lon)
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * R_NM * math.asin(math.sqrt(h))


def _route_total_nm(route: Iterable[dict]) -> float:
    pts = list(route)
    total = 0.0
    for a, b in zip(pts, pts[1:]):
        total += _haversine_nm(a["lat"], a["lon"], b["lat"], b["lon"])
    return total


def _interp_along(route: list[dict], frac: float) -> tuple[Coordinate, int]:
    """Returns (position, course_deg)."""
    frac = min(max(frac, 0.0), 1.0)
    total = _route_total_nm(route)
    if total <= 0:
        p = route[0]
        return Coordinate(lat=p["lat"], lon=p["lon"]), 0
    target = total * frac
    accum = 0.0
    for a, b in zip(route, route[1:]):
        seg = _haversine_nm(a["lat"], a["lon"], b["lat"], b["lon"])
        if accum + seg >= target:
            t = (target - accum) / seg if seg > 0 else 0.0
            lat = a["lat"] + (b["lat"] - a["lat"]) * t
            lon = a["lon"] + (b["lon"] - a["lon"]) * t
            # bearing from a -> b
            phi1 = math.radians(a["lat"])
            phi2 = math.radians(b["lat"])
            lam = math.radians(b["lon"] - a["lon"])
            x = math.sin(lam) * math.cos(phi2)
            y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(lam)
            cog = (math.degrees(math.atan2(x, y)) + 360) % 360
            return Coordinate(lat=lat, lon=lon), int(cog)
        accum += seg
    p = route[-1]
    return Coordinate(lat=p["lat"], lon=p["lon"]), 0


def _phase_for(progress: float) -> VoyagePhase:
    if progress < 5:
        return "departure"
    if progress > 95:
        return "docking"
    if progress > 85:
        return "approach"
    return "in_transit"


def _risk_band(score: int) -> RiskBand:
    if score >= 70:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


# ----- main -----


async def compute_live_snapshot(_db: AsyncSession, voyage) -> VoyageLiveSnapshot:
    """Compute a fresh live snapshot for a voyage row.

    The voyage has either a `status='completed'` (use end-of-route) or is
    in-flight: progress is wall-time vs planned duration, modulated by a
    weather slowdown if reachable.
    """
    now = datetime.now(tz=timezone.utc)
    planned_dep = _parse_iso(voyage.planned_departure) or now
    planned_arr = _parse_iso(voyage.planned_arrival) or (planned_dep + (now - planned_dep) * 2)
    actual_dep = _parse_iso(voyage.actual_departure) or planned_dep
    planned_total_min = max(60.0, (planned_arr - planned_dep).total_seconds() / 60.0)

    # Progress
    if voyage.status in ("completed", "aborted"):
        frac = 1.0
        elapsed_min = planned_total_min
    else:
        elapsed_min = max(0.0, (now - actual_dep).total_seconds() / 60.0)
        # Use elapsed + small extension so we drift past plan rather than freeze.
        # 1.0 is "exactly on plan", >1.0 means we're behind plan in wall-time.
        wall_frac = elapsed_min / planned_total_min
        # ETA confidence drops as we deviate
        # cap progress at 99% until status turns completed
        frac = min(0.99, wall_frac * 0.95)

    route = list(voyage.route_planned or [])
    if len(route) < 2:
        route = [
            {"lat": voyage.origin_lat, "lon": voyage.origin_lon},
            {"lat": voyage.destination_lat, "lon": voyage.destination_lon},
        ]

    pos, cog = _interp_along(route, frac)
    total_nm = _route_total_nm(route)
    remaining_nm = total_nm * (1 - frac)
    progress_pct = int(round(frac * 100))

    # Weather lookup at current position (best-effort; never blocks the snapshot)
    try:
        weather = await get_weather(pos.lat, pos.lon)
    except Exception:  # pragma: no cover — defensive
        from ...services.adapters.open_meteo import WeatherSnapshot
        weather = WeatherSnapshot(0.0, 0.0, None, "offline")

    # Speed-over-ground baseline ~14kn, reduced if wind > 30kn
    base_sog = 14.0
    sog = max(8.0, base_sog - max(0.0, weather.wind_speed_kn - 25.0) * 0.10)
    # Stable jitter from voyage id so the same voyage gives stable values across calls in test.
    rng = random.Random(hash(voyage.id) % (2**32))
    sog = round(sog + rng.uniform(-0.4, 0.4), 1)

    # Compute current ETA: remaining_nm at current sog, append to now
    if sog > 0 and remaining_nm > 0:
        remaining_hours = remaining_nm / sog
        from datetime import timedelta
        current_eta_dt = now + timedelta(hours=remaining_hours)
    else:
        current_eta_dt = planned_arr
    current_eta = current_eta_dt.isoformat()

    eta_delta_min = int(round((current_eta_dt - planned_arr).total_seconds() / 60.0))

    # Risk score: weather (40), eta delay (30), random base (10), bias for high cargoPriority (20)
    risk = 10
    risk += min(40, int(weather.wind_speed_kn * 1.1))
    risk += min(30, max(0, eta_delta_min // 6))
    if (voyage.cargo_priority or "").lower() == "critical":
        risk += 20
    risk = max(0, min(100, risk))

    return VoyageLiveSnapshot(
        voyageId=voyage.id,
        position=pos,
        sog=sog,
        cog=cog,
        heading=cog,
        distanceRemainingNm=round(remaining_nm, 1),
        distanceTotalNm=round(total_nm, 1),
        progressPct=progress_pct,
        currentETA=current_eta,
        etaDeltaMin=eta_delta_min,
        etaConfidence=round(max(0.55, 0.95 - (abs(eta_delta_min) / 600.0)), 2),
        riskScore=risk,
        riskBand=_risk_band(risk),
        phase=_phase_for(progress_pct),
        asOf=now.isoformat(),
    )
