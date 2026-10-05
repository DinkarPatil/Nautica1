"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";
import { canAccessPage } from "../../lib/permissions";

interface Props {
  /** Allowed roles for this page */
  allowedRoles?: UserRole[];
  /** Or check by path */
  path?: string;
  children: ReactNode;
}

export default function ProtectedPage({ allowedRoles, path, children }: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/unauthorized");
      return;
    }
    if (path && !canAccessPage(user.role, path)) {
      router.replace("/unauthorized");
    }
  }, [user, isLoading, allowedRoles, path, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold-muted border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="font-body text-xs tracking-[0.2em] uppercase text-greige">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
