"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, Search, Clock, LogOut, ChevronDown,
  AlertTriangle, Brain, Ship, ArrowUpRight, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS, ROLE_COLORS } from "../../types";

type MockNotif = {
  id: string;
  kind: "risk" | "ai" | "vessel";
  title: string;
  body: string;
  time: string;
  href: string;
};

const NOTIFICATIONS: MockNotif[] = [
  {
    id: "n001",
    kind: "risk",
    title: "Critical risk alert",
    body: "Houthi escalation in Bab-el-Mandeb · 7 vessels in threat corridor",
    time: "2 min ago",
    href: "/risk",
  },
  {
    id: "n002",
    kind: "ai",
    title: "New AI decision",
    body: "Reroute via Cape of Good Hope · Confidence 96% · Saves $1.2M",
    time: "14 min ago",
    href: "/agi?focus=top",
  },
  {
    id: "n003",
    kind: "vessel",
    title: "Vessel delay",
    body: "MV Pacific Empress · 18h projected delay at Singapore anchorage",
    time: "1 hr ago",
    href: "/fleet",
  },
];

const NOTIF_ICON: Record<MockNotif["kind"], { Icon: typeof AlertTriangle; color: string; bg: string }> = {
  risk:   { Icon: AlertTriangle, color: "#8B5252", bg: "rgba(139,82,82,0.08)" },
  ai:     { Icon: Brain,         color: "#9A7F35", bg: "rgba(184,155,74,0.08)" },
  vessel: { Icon: Ship,          color: "#4A5568", bg: "rgba(74,85,104,0.08)" },
};

export default function TopBar() {
  const [time, setTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const visibleNotifs = NOTIFICATIONS.filter((n) => !dismissed.has(n.id));

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getUTCHours().toString().padStart(2, "0");
      const m = now.getUTCMinutes().toString().padStart(2, "0");
      const s = now.getUTCSeconds().toString().padStart(2, "0");
      setTime(`${h}:${m}:${s} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const dismissOne = (id: string) =>
    setDismissed((prev) => new Set(prev).add(id));
  const clearAll = () =>
    setDismissed(new Set(NOTIFICATIONS.map((n) => n.id)));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleColors = user ? ROLE_COLORS[user.role] : null;
  const roleLabel = user ? ROLE_LABELS[user.role] : "";

  return (
    <header
      className="fixed top-0 left-[280px] right-0 h-[72px] z-40 flex items-center justify-between px-8 border-b"
      style={{
        background: "rgba(250, 248, 245, 0.96)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(180, 170, 155, 0.25)",
      }}
    >
      {/* Left — system indicators */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-stone">
          <Clock size={12} className="text-greige" strokeWidth={1.6} />
          <span className="font-body font-num text-xs tracking-[0.05em] text-stone" style={{ fontWeight: 400 }}>{time}</span>
        </div>
        <div className="w-px h-4 bg-sand/60" />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-maritime-success" />
          <span className="font-body text-xs tracking-[0.08em] uppercase text-stone" style={{ fontWeight: 400 }}>Live</span>
        </div>
        {user && (
          <>
            <div className="w-px h-4 bg-sand/60" />
            <span
              className="flex items-center gap-2 font-body text-xs tracking-[0.08em] uppercase px-2.5 py-1"
              style={{ color: "#9A7F35", fontWeight: 400 }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 animate-pulse" style={{ background: "#C9A962" }} />
              </span>
              AI Command Core · Live decision mode
            </span>
          </>
        )}
      </div>

      {/* Center — search */}
      <div
        className="flex items-center gap-2.5 bg-ivory-warm border border-sand/50 px-4 py-2.5 w-64 group focus-within:border-gold-muted focus-within:ring-1 focus-within:ring-gold-muted/15 transition-all duration-200"
      >
        <Search size={12} className="text-greige flex-shrink-0" />
        <input
          type="text"
          placeholder="Vessels, ports, IMO..."
          className="bg-transparent font-body text-sm text-charcoal-warm placeholder:text-taupe outline-none w-full"
        />
      </div>

      {/* Right — notifications + user */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={notifOpen}
            aria-label={`Notifications${visibleNotifs.length ? ` (${visibleNotifs.length} unread)` : ""}`}
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
            className={`relative p-2 rounded-sm transition-colors duration-150 group ${
              notifOpen ? "bg-parchment" : "hover:bg-parchment"
            }`}
          >
            <Bell
              size={15}
              strokeWidth={1.6}
              className={`${notifOpen ? "text-charcoal-warm" : "text-stone group-hover:text-charcoal-warm"} transition-colors`}
            />
            {visibleNotifs.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-maritime-error flex items-center justify-center">
                <span className="font-body font-num text-[10px] text-ivory-cream" style={{ fontWeight: 600 }}>
                  {visibleNotifs.length}
                </span>
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div
              role="menu"
              aria-label="Notifications"
              className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-sand/50 z-[60] animate-fade-in-up"
              style={{ boxShadow: "0 12px 32px rgba(26,24,22,0.10), 0 2px 4px rgba(26,24,22,0.04)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-sand/30">
                <div className="flex items-center gap-2">
                  <span className="font-body text-[11px] tracking-[0.1em] uppercase text-greige" style={{ fontWeight: 500 }}>
                    Notifications
                  </span>
                  {visibleNotifs.length > 0 && (
                    <span className="font-body font-num text-[11px] text-stone" style={{ fontWeight: 500 }}>
                      ({visibleNotifs.length})
                    </span>
                  )}
                </div>
                {visibleNotifs.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="font-body text-[11px] tracking-[0.05em] uppercase text-gold-deep hover:text-gold-muted transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto">
                {visibleNotifs.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Bell size={20} className="text-taupe mx-auto mb-3" strokeWidth={1.4} />
                    <div className="font-body text-sm text-charcoal-warm" style={{ fontWeight: 500 }}>
                      You're all caught up
                    </div>
                    <div className="font-body text-xs text-greige mt-1">
                      No new notifications
                    </div>
                  </div>
                ) : (
                  visibleNotifs.map((n) => {
                    const cfg = NOTIF_ICON[n.kind];
                    const Icon = cfg.Icon;
                    return (
                      <div
                        key={n.id}
                        className="group flex items-start gap-3 px-5 py-3.5 border-b border-sand/20 last:border-b-0 hover:bg-ivory-warm transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: cfg.bg }}
                        >
                          <Icon size={14} strokeWidth={1.6} style={{ color: cfg.color }} />
                        </div>
                        <Link
                          href={n.href}
                          onClick={() => setNotifOpen(false)}
                          className="flex-1 min-w-0"
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-body text-sm text-charcoal-deep truncate" style={{ fontWeight: 500 }}>
                              {n.title}
                            </span>
                            <span className="font-body text-[10px] text-greige flex-shrink-0" style={{ fontWeight: 400 }}>
                              {n.time}
                            </span>
                          </div>
                          <p className="font-body text-xs text-stone leading-snug line-clamp-2" style={{ fontWeight: 400 }}>
                            {n.body}
                          </p>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissOne(n.id);
                          }}
                          aria-label="Dismiss notification"
                          className="p-1 -mt-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-parchment transition-all"
                        >
                          <X size={11} className="text-stone" strokeWidth={1.6} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-sand/30" style={{ background: "rgba(237,232,223,0.3)" }}>
                <Link
                  href="/risk"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center justify-center gap-1.5 font-body text-xs tracking-[0.05em] uppercase text-charcoal-warm hover:text-charcoal-deep transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  View all alerts
                  <ArrowUpRight size={11} strokeWidth={1.6} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        {user && (
          <div className="relative pl-3 border-l border-sand/50" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 hover:bg-parchment px-2 py-1.5 rounded-sm transition-colors duration-150 group"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center text-initials text-sm flex-shrink-0"
                style={{ background: roleColors?.bg, color: roleColors?.text }}
              >
                {user.avatar}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-body text-[12px] text-charcoal-deep font-medium leading-tight">
                  {user.name.split(" ").slice(-1)[0]}
                </div>
                <div
                  className="font-body text-xs tracking-[0.15em] uppercase leading-tight"
                  style={{ color: roleColors?.text }}
                >
                  {roleLabel}
                </div>
              </div>
              <ChevronDown
                size={12}
                className={`text-stone transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-sand/50 shadow-lg z-50">
                {/* Profile header */}
                <div className="px-5 py-4 border-b border-sand/30">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-sm flex items-center justify-center text-initials text-base flex-shrink-0"
                      style={{ background: roleColors?.bg, color: roleColors?.text }}
                    >
                      {user.avatar}
                    </div>
                    <div>
                      <div className="font-body text-sm text-charcoal-deep font-medium">{user.name}</div>
                      <div className="font-body text-xs text-greige">{user.email}</div>
                    </div>
                  </div>
                  {/* Role badge */}
                  <div className="mt-3">
                    <span
                      className="font-body text-xs tracking-[0.25em] uppercase px-2.5 py-1 border"
                      style={{ background: roleColors?.bg, color: roleColors?.text, borderColor: roleColors?.border }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Organization */}
                <div className="px-5 py-3 border-b border-sand/20">
                  <div className="font-body text-xs tracking-[0.2em] uppercase text-greige mb-0.5">Organization</div>
                  <div className="font-body text-xs text-charcoal-warm">{user.organization}</div>
                </div>

                {/* Last login */}
                <div className="px-5 py-3 border-b border-sand/20">
                  <div className="font-body text-xs tracking-[0.2em] uppercase text-greige mb-0.5">Last Login</div>
                  <div className="font-body text-xs text-charcoal-warm">
                    {new Date(user.lastLogin).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })} UTC
                  </div>
                </div>

                {/* Logout */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-maritime-error hover:bg-maritime-error/5 transition-colors duration-150 rounded-sm"
                  >
                    <LogOut size={13} />
                    <span className="font-body text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
