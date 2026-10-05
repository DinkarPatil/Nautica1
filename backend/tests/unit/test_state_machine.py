"""Voyage state machine — pure logic."""

from __future__ import annotations

import pytest

from app.domains.voyage.state_machine import (
    LEGACY_MAP,
    TRANSITIONS,
    VALID_STATES,
    can_transition,
    normalise_state,
)


def test_normalise_legacy_states():
    for legacy, canonical in LEGACY_MAP.items():
        assert normalise_state(legacy) == canonical


def test_normalise_canonical_passthrough():
    for s in VALID_STATES:
        assert normalise_state(s) == s


def test_normalise_unknown_collapses_to_draft():
    assert normalise_state("unicorn") == "draft"
    assert normalise_state(None) == "draft"


def test_can_transition_happy_path():
    chain = ["draft", "ready", "active", "in_transit", "approaching_destination", "completed", "archived"]
    for a, b in zip(chain, chain[1:]):
        assert can_transition(a, b), f"expected transition {a} → {b}"


def test_cannot_skip_states():
    assert not can_transition("draft", "completed")
    assert not can_transition("ready", "approaching_destination")
    assert not can_transition("active", "archived") is False  # active CAN go to archived (cancellation)


def test_cannot_leave_archived():
    for s in VALID_STATES:
        assert not can_transition("archived", s)


def test_legacy_input_normalised_for_check():
    # `created` normalises to draft → ready is valid
    assert can_transition("created", "ready")
    # `docked` normalises to completed → archived is valid
    assert can_transition("docked", "archived")


def test_invalid_target_rejected():
    assert not can_transition("draft", "moonbase")
