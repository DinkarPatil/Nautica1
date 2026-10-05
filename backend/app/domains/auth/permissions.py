"""Role → permission map.

Mirror of `frontend/app/lib/permissions.ts`. Keep these in sync.
"""

from __future__ import annotations

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "ai_core": {
        "VIEW_ALL", "RUN_AGI",
        "VIEW_FLEET_POSITION", "VIEW_PORTS",
        "VIEW_TRADE_AGI",
        "VIEW_ALL_ALERTS", "CREATE_ALERT", "EDIT_ALERT", "ESCALATE",
        "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED",
    },
    "executive": {
        "VIEW_ALL", "CREATE", "EDIT", "DELETE", "APPROVE", "ESCALATE",
        "MANAGE_USERS", "AUDIT_LOG", "RUN_AGI",
        "VIEW_FLEET_POSITION", "VIEW_PORTS",
        "CREATE_TRADE", "EDIT_TRADE", "VIEW_TRADE_AGI",
        "VIEW_ALL_ALERTS", "CREATE_ALERT", "EDIT_ALERT",
        "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED", "EDIT_PORT_STATUS",
    },
    "fleet_ops": {
        "VIEW_ALL", "CREATE", "EDIT", "ESCALATE", "RUN_AGI",
        "VIEW_FLEET_POSITION", "VIEW_PORTS",
        "VIEW_TRADE_AGI",
        "VIEW_ALL_ALERTS", "CREATE_ALERT",
        "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED", "EDIT_PORT_STATUS",
    },
    "trade_intel": {
        "VIEW_FLEET_POSITION", "VIEW_PORTS",
        "CREATE_TRADE", "EDIT_TRADE", "VIEW_TRADE_AGI",
    },
    "risk_intel": {
        "VIEW_ALL", "RUN_AGI",
        "VIEW_FLEET_POSITION", "VIEW_PORTS",
        "VIEW_ALL_ALERTS", "CREATE_ALERT", "EDIT_ALERT", "ESCALATE",
        "VIEW_TRADE_AGI",
    },
    "port_ops": {
        "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED", "EDIT_PORT_STATUS",
        "VIEW_ALL_ALERTS",
    },
}


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
