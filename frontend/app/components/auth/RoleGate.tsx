"use client";

import { useAuth } from "../../context/AuthContext";
import { UserRole, Permission } from "../../types";
import { canDo, canDoAny } from "../../lib/permissions";
import { ReactNode } from "react";

interface RoleGateProps {
  /** Show only for these roles */
  roles?: UserRole[];
  /** Show only if user has this permission */
  permission?: Permission;
  /** Show if user has ANY of these permissions */
  anyPermission?: Permission[];
  children: ReactNode;
  /** What to render instead when access denied (default: nothing) */
  fallback?: ReactNode;
}

export default function RoleGate({
  roles,
  permission,
  anyPermission,
  children,
  fallback = null,
}: RoleGateProps) {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  if (roles && !roles.includes(user.role)) return <>{fallback}</>;
  if (permission && !canDo(user.role, permission)) return <>{fallback}</>;
  if (anyPermission && !canDoAny(user.role, anyPermission)) return <>{fallback}</>;

  return <>{children}</>;
}
