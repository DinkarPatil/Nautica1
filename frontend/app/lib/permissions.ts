import { UserRole, Permission } from "../types";

// ─── Permission Map ───────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ai_core: [
    "VIEW_ALL", "RUN_AGI",
    "VIEW_FLEET_POSITION", "VIEW_PORTS",
    "VIEW_TRADE_AGI",
    "VIEW_ALL_ALERTS", "CREATE_ALERT", "EDIT_ALERT", "ESCALATE",
    "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED",
  ],
  executive: [
    "VIEW_ALL", "CREATE", "EDIT", "DELETE", "APPROVE", "ESCALATE",
    "MANAGE_USERS", "AUDIT_LOG", "RUN_AGI",
    "VIEW_FLEET_POSITION", "VIEW_PORTS",
    "CREATE_TRADE", "EDIT_TRADE", "VIEW_TRADE_AGI",
    "VIEW_ALL_ALERTS", "CREATE_ALERT", "EDIT_ALERT",
    "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED", "EDIT_PORT_STATUS",
  ],
  fleet_ops: [
    "VIEW_ALL", "CREATE", "EDIT", "ESCALATE", "RUN_AGI",
    "VIEW_FLEET_POSITION", "VIEW_PORTS",
    "VIEW_TRADE_AGI",
    "VIEW_ALL_ALERTS", "CREATE_ALERT",
    "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED", "EDIT_PORT_STATUS",
  ],
  trade_intel: [
    "VIEW_FLEET_POSITION", "VIEW_PORTS",
    "CREATE_TRADE", "EDIT_TRADE", "VIEW_TRADE_AGI",
  ],
  risk_intel: [
    "VIEW_ALL", "RUN_AGI",
    "VIEW_FLEET_POSITION", "VIEW_PORTS",
    "VIEW_ALL_ALERTS", "CREATE_ALERT", "EDIT_ALERT", "ESCALATE",
    "VIEW_TRADE_AGI",
  ],
  port_ops: [
    "VIEW_ASSIGNED_PORTS", "VIEW_FLEET_ASSIGNED", "EDIT_PORT_STATUS",
    "VIEW_ALL_ALERTS",
  ],
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function canDo(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canDoAny(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => canDo(role, p));
}

export function canDoAll(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => canDo(role, p));
}

// ─── Page Access ──────────────────────────────────────────────────────────────

export const PAGE_ACCESS: Record<string, UserRole[]> = {
  "/dashboard": ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/fleet":     ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/ports":     ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/risk":      ["ai_core", "executive", "fleet_ops", "risk_intel"],
  "/trade":     ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel"],
  "/agi":       ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel"],
};

export function canAccessPage(role: UserRole, path: string): boolean {
  const allowed = PAGE_ACCESS[path];
  if (!allowed) return true; // unknown paths allowed
  return allowed.includes(role);
}

// ─── Nav Visibility ───────────────────────────────────────────────────────────

export const NAV_ACCESS: Record<string, UserRole[]> = {
  "/dashboard": ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/fleet":     ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel", "port_ops"],
  "/ports":     ["ai_core", "executive", "fleet_ops", "port_ops", "risk_intel", "trade_intel"],
  "/risk":      ["ai_core", "executive", "fleet_ops", "risk_intel"],
  "/trade":     ["ai_core", "executive", "fleet_ops", "trade_intel"],
  "/agi":       ["ai_core", "executive", "fleet_ops", "trade_intel", "risk_intel"],
};

export function canSeeNav(role: UserRole, path: string): boolean {
  const allowed = NAV_ACCESS[path];
  if (!allowed) return false;
  return allowed.includes(role);
}

// ─── Role Hierarchy Level ─────────────────────────────────────────────────────

export const ROLE_LEVEL: Record<UserRole, number> = {
  ai_core: 5,
  executive: 5,
  fleet_ops: 4,
  trade_intel: 3,
  risk_intel: 3,
  port_ops: 2,
};

export function isHigherOrEqual(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_LEVEL[roleA] >= ROLE_LEVEL[roleB];
}
