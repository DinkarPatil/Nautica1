from app.domains.auth.permissions import has_permission


def test_executive_has_view_all():
    assert has_permission("executive", "VIEW_ALL")
    assert has_permission("executive", "APPROVE")


def test_port_ops_lacks_create_alert():
    assert not has_permission("port_ops", "CREATE_ALERT")


def test_unknown_role_returns_false():
    assert not has_permission("nonexistent", "VIEW_ALL")
