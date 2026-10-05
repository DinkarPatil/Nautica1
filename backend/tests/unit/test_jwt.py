"""Unit tests for JWT encode/decode."""

from __future__ import annotations

import pytest

from app.domains.auth.jwt import TokenInvalid, decode_token, encode_token


def test_encode_decode_roundtrip():
    token = encode_token("u001", "executive", "access")
    payload = decode_token(token, expected_kind="access")
    assert payload["sub"] == "u001"
    assert payload["role"] == "executive"
    assert payload["kind"] == "access"


def test_wrong_kind_rejected():
    refresh = encode_token("u001", "executive", "refresh")
    with pytest.raises(TokenInvalid):
        decode_token(refresh, expected_kind="access")


def test_garbage_token_rejected():
    with pytest.raises(TokenInvalid):
        decode_token("not-a-jwt")
