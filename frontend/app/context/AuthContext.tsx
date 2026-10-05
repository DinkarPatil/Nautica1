"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "../types";
import { setAccessToken } from "@/lib/api/client";

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) ||
  "http://localhost:8000";
const USE_MOCK =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK === "1") || false;

// ─── Mock Users ───────────────────────────────────────────────────────────────

const MOCK_USERS: Record<string, { user: User; password: string }> = {
  "admiral@glimmora.com": {
    password: "demo",
    user: {
      id: "u001",
      name: "Capt. James Blackwood",
      email: "admiral@glimmora.com",
      role: "executive",
      avatar: "JB",
      organization: "GlimmoraNautica HQ",
      lastLogin: "2026-04-26T08:00:00Z",
    },
  },
  "manager@glimmora.com": {
    password: "demo",
    user: {
      id: "u002",
      name: "Sarah Chen",
      email: "manager@glimmora.com",
      role: "fleet_ops",
      avatar: "SC",
      organization: "GlimmoraNautica · Operations",
      lastLogin: "2026-04-26T07:30:00Z",
    },
  },
  "trader@glimmora.com": {
    password: "demo",
    user: {
      id: "u003",
      name: "Marco Silva",
      email: "trader@glimmora.com",
      role: "trade_intel",
      avatar: "MS",
      organization: "GlimmoraNautica · Trade Flow",
      lastLogin: "2026-04-25T18:00:00Z",
    },
  },
  "analyst@glimmora.com": {
    password: "demo",
    user: {
      id: "u004",
      name: "Priya Kumar",
      email: "analyst@glimmora.com",
      role: "risk_intel",
      avatar: "PK",
      organization: "GlimmoraNautica · Predictive Risk",
      lastLogin: "2026-04-26T06:15:00Z",
    },
  },
  "port@glimmora.com": {
    password: "demo",
    user: {
      id: "u005",
      name: "David Roberts",
      email: "port@glimmora.com",
      role: "port_ops",
      avatar: "DR",
      organization: "GlimmoraNautica · Port Network",
      lastLogin: "2026-04-25T14:00:00Z",
    },
  },
  "core@glimmora.com": {
    password: "demo",
    user: {
      id: "u000",
      name: "AI Command Core",
      email: "core@glimmora.com",
      role: "ai_core",
      avatar: "AI",
      organization: "GlimmoraNautica · Intelligence Engine",
      lastLogin: "2026-04-26T00:00:00Z",
    },
  },
};

// ─── Context Types ────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "glimmora_user";

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    let userData: User;
    if (USE_MOCK) {
      const entry = MOCK_USERS[email.toLowerCase().trim()];
      if (!entry || entry.password !== password) {
        throw new Error("Invalid credentials. Use any demo account with password: demo");
      }
      userData = { ...entry.user, lastLogin: new Date().toISOString() };
    } else {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const text = await res.text();
      let body: any = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        /* fallthrough */
      }
      if (!res.ok) {
        const msg = body?.error?.message || `Login failed (${res.status})`;
        throw new Error(msg);
      }
      setAccessToken(body.access_token);
      userData = {
        id: body.user.id,
        name: body.user.name,
        email: body.user.email,
        role: body.user.role,
        avatar: body.user.avatar,
        organization: body.user.organization,
        lastLogin: body.user.lastLogin || new Date().toISOString(),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    document.cookie = `glimmora_session=${encodeURIComponent(
      JSON.stringify({ role: userData.role, id: userData.id })
    )}; path=/; SameSite=Lax`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAccessToken(null);
    document.cookie =
      "glimmora_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ─── Export demo accounts (for login page) ───────────────────────────────────
// Order matters — top of the list is the highest-tier account.
export const DEMO_ACCOUNTS = Object.values(MOCK_USERS)
  .map(({ user }) => user)
  .filter((u) => u.role !== "ai_core");
