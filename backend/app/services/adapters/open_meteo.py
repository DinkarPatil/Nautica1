"""Open-Meteo weather adapter.

Free, no API key. We use the marine endpoint (wave height, period) plus the
forecast endpoint (wind speed at 10m) to feed risk scoring + brief generation.

If the network is unavailable we return zeros so callers can degrade gracefully.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import httpx

log = logging.getLogger("open_meteo")

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
TIMEOUT = 8.0


@dataclass(slots=True)
class WeatherSnapshot:
    wind_speed_kn: float
    wind_dir_deg: float
    wave_height_m: Optional[float]
    source: str


async def get_weather(lat: float, lon: float) -> WeatherSnapshot:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                FORECAST_URL,
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "wind_speed_10m,wind_direction_10m",
                    "wind_speed_unit": "kn",
                },
            )
        if resp.status_code >= 400:
            log.warning("open_meteo_http_error", extra={"status": resp.status_code})
            return WeatherSnapshot(0.0, 0.0, None, source="offline")
        data = resp.json()
        cur = data.get("current") or {}
        return WeatherSnapshot(
            wind_speed_kn=float(cur.get("wind_speed_10m") or 0.0),
            wind_dir_deg=float(cur.get("wind_direction_10m") or 0.0),
            wave_height_m=None,
            source="open-meteo",
        )
    except httpx.HTTPError as exc:
        log.warning("open_meteo_network_error", extra={"err": str(exc)})
        return WeatherSnapshot(0.0, 0.0, None, source="offline")
