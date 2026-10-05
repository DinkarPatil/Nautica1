"""OpenSanctions match adapter.

Free public API: POST https://api.opensanctions.org/match/sanctions
Docs: https://www.opensanctions.org/api/

We keep the adapter purely transport-level: takes a query string + optional
schema (Vessel, Company, Person), returns a normalized list of hits. The risk
service decides match-or-not and adds an AI-generated explanation.

If the network is unavailable we return an empty hit list and source="offline".
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

log = logging.getLogger("opensanctions")

OPENSANCTIONS_URL = "https://api.opensanctions.org/match/sanctions"
DEFAULT_TIMEOUT_S = 8.0


async def screen(query: str, *, kind: str = "any") -> dict[str, Any]:
    if kind == "vessel":
        schema_kind = "Vessel"
        properties = {"name": [query]}
    elif kind == "company":
        schema_kind = "Organization"
        properties = {"name": [query]}
    elif kind == "person":
        schema_kind = "Person"
        properties = {"name": [query]}
    else:
        # "any" — try entity by name. OpenSanctions returns hits across schemas
        # via the generic "Thing" route; we bias to LegalEntity which usually
        # surfaces both companies and persons.
        schema_kind = "LegalEntity"
        properties = {"name": [query]}

    body = {"queries": {"q1": {"schema": schema_kind, "properties": properties}}}

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_S) as client:
            resp = await client.post(OPENSANCTIONS_URL, json=body)
        if resp.status_code >= 400:
            log.warning("opensanctions_http_error", extra={"status": resp.status_code, "body": resp.text[:300]})
            return {"hits": [], "source": "opensanctions", "error": f"http_{resp.status_code}"}
        data = resp.json()
    except httpx.HTTPError as exc:
        log.warning("opensanctions_network_error", extra={"err": str(exc)})
        return {"hits": [], "source": "offline", "error": str(exc)}

    raw_results = (data or {}).get("responses", {}).get("q1", {}).get("results", [])
    hits = []
    for r in raw_results[:10]:
        props = r.get("properties", {}) or {}
        names = props.get("name") or []
        countries = props.get("country") or []
        hits.append(
            {
                "name": (names[0] if names else r.get("caption") or "?"),
                "source": "opensanctions",
                "listEntry": (r.get("datasets") or [None])[0],
                "score": r.get("score"),
                "schema": r.get("schema"),
                "countries": countries,
            }
        )
    return {"hits": hits, "source": "opensanctions", "raw": data}
