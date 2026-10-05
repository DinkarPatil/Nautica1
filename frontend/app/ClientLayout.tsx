"use client";

import { useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SimulationProvider } from "./context/SimulationContext";
import { ToastProvider } from "./context/ToastContext";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import StatusBar from "./components/layout/StatusBar";

const AUTH_FREE = ["/login", "/unauthorized"];
const FULL_BLEED = ["/voyage"];

function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isAuthFree = isLanding || AUTH_FREE.some((p) => pathname?.startsWith(p));
  const isFullBleed = FULL_BLEED.some((p) => pathname?.startsWith(p));

  // Sync user to cookie for middleware
  useEffect(() => {
    if (user) {
      document.cookie = `glimmora_session=${encodeURIComponent(
        JSON.stringify({ role: user.role, id: user.id })
      )}; path=/; SameSite=Lax`;
    } else {
      document.cookie = "glimmora_session=; path=/; max-age=0";
    }
  }, [user]);

  if (isAuthFree || isFullBleed) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <TopBar />
      <main
        className="ml-[280px] mt-[72px] mb-[40px] overflow-y-auto"
        style={{ height: "calc(100vh - 112px)" }}
      >
        {children}
      </main>
      <StatusBar />
    </>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SimulationProvider>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </SimulationProvider>
    </AuthProvider>
  );
}
