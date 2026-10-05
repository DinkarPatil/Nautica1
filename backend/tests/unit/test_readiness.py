"""Voyage Readiness Score — pure deterministic logic."""

from __future__ import annotations

from app.domains.voyage.readiness import compute_readiness
from app.domains.voyage.schemas import PortMini, VoyageDraftIn


def _draft(**overrides):
    base = {
        "shipName": "MV Tester",
        "imo": "1234567",
        "voyageType": "Container",
        "origin": PortMini(id="p_alg", unlocode="ESALG", name="Algeciras", country="ES", lat=36.14, lon=-5.45),
        "destination": PortMini(id="p_rtm", unlocode="NLRTM", name="Rotterdam", country="NL", lat=51.92, lon=4.48),
        "plannedDeparture": "2026-04-26T04:00:00Z",
        "plannedArrival": "2026-05-02T12:24:00Z",
        "sensitivity": "Strict",
        "trackingMode": "Real-time",
        "alertPreference": "Full intelligence",
        "cargoPriority": "High",
        "delayToleranceMin": "60",
    }
    base.update(overrides)
    return VoyageDraftIn(**base)


def test_complete_draft_is_green_and_can_start():
    r = compute_readiness(_draft())
    assert r.score == 100
    assert r.band == "green"
    assert r.canStart is True


def test_missing_destination_red_cannot_start():
    r = compute_readiness(_draft(destination=None))
    assert r.band in ("red", "amber")
    assert r.canStart is False
    fields = {f.field: f.status for f in r.factors}
    assert fields.get("destination") == "missing"


def test_missing_imo_warns_but_can_still_start():
    r = compute_readiness(_draft(imo=""))
    assert r.canStart is True
    fields = {f.field: f.status for f in r.factors}
    assert fields.get("imo") == "warn"


def test_same_origin_destination_warns():
    same = PortMini(id="p_alg", unlocode="ESALG", name="Algeciras", country="ES", lat=36.14, lon=-5.45)
    r = compute_readiness(_draft(origin=same, destination=same))
    assert r.canStart is False
    statuses = {f.field: f.status for f in r.factors}
    # Either route flagged as warn, or destination/origin still considered ok
    assert statuses.get("route") == "warn"


def test_missing_planned_departure_blocks_start():
    r = compute_readiness(_draft(plannedDeparture=""))
    assert r.canStart is False
    fields = {f.field: f.status for f in r.factors}
    assert fields["plannedDeparture"] == "missing"
