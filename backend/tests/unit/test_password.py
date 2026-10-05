from app.domains.auth.password import hash_password, verify_password


def test_hash_and_verify_roundtrip():
    h = hash_password("demo")
    assert h != "demo"
    assert verify_password("demo", h)
    assert not verify_password("wrong", h)
