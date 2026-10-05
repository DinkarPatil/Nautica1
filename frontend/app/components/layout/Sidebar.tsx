"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Ship, Anchor, FileText, ShieldAlert, Brain, Globe2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { canSeeNav } from "../../lib/permissions";
import { ROLE_LABELS, ROLE_COLORS } from "../../types";

const allNavItems = [
  { section: "Command", href: "/dashboard", icon: LayoutDashboard, label: "Executive Bridge" },
  { section: "Operations", href: "/fleet", icon: Ship, label: "Fleet Intelligence" },
  { section: "Operations", href: "/ports", icon: Anchor, label: "Port Operations" },
  { section: "Intelligence", href: "/risk", icon: ShieldAlert, label: "Risk & Sanctions" },
  { section: "Intelligence", href: "/trade", icon: FileText, label: "Trade Documents" },
  { section: "Intelligence", href: "/agi", icon: Brain, label: "AGI Decisions" },
];

const sections = ["Command", "Operations", "Intelligence"];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleItems = allNavItems.filter((item) =>
    user ? canSeeNav(user.role, item.href) : false
  );

  const roleColors = user ? ROLE_COLORS[user.role] : null;
  const roleLabel = user ? ROLE_LABELS[user.role] : "";

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[280px] z-50 flex flex-col"
      style={{ background: "linear-gradient(160deg, #2D2A26 0%, #1A1816 100%)" }}
    >
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #FAF8F5 0px, #FAF8F5 1px, transparent 0px, transparent 50%)",
          backgroundSize: "10px 10px",
        }}
      />

      {/* Logo */}
      <div className="relative flex flex-col px-7 pt-9 pb-7 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 mb-1">
          <Globe2 size={18} className="text-gold-muted opacity-80" />
          <span className="font-body text-xs tracking-[0.4em] uppercase text-gold-soft/80">
            Est. MMXXVI
          </span>
        </div>
        <div className="font-display text-[1.55rem] tracking-[0.12em] uppercase leading-none text-ivory-cream" style={{ fontWeight: 300 }}>
          Glimmora
        </div>
        <div className="font-body text-xs tracking-[0.3em] uppercase text-greige mt-1">
          Nautica Intelligence
        </div>
        <div className="w-8 h-px bg-gold-muted/50 mt-4" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => {
          const items = visibleItems.filter((i) => i.section === section);
          if (!items.length) return null;
          return (
            <div key={section} className="mb-5">
              <p className="font-body text-xs tracking-[0.3em] uppercase text-ivory-cream/40 px-4 mb-1.5">
                {section}
              </p>
              <ul className="space-y-0.5">
                {items.map(({ href, icon: Icon, label }) => {
                  const isActive = pathname === href || pathname?.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`
                          relative flex items-center gap-3 px-4 py-2.5 rounded-sm
                          font-body text-xs tracking-[0.1em] uppercase
                          transition-all duration-200 group
                          ${isActive
                            ? "text-ivory-cream bg-white/[0.08]"
                            : "text-ivory-cream/65 hover:text-ivory-cream hover:bg-white/[0.06]"
                          }
                        `}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold-muted rounded-r" />
                        )}
                        <Icon
                          size={14}
                          className={`flex-shrink-0 transition-colors duration-200 ${
                            isActive ? "text-gold-soft" : "text-ivory-cream/45 group-hover:text-gold-soft/70"
                          }`}
                        />
                        <span>{label}</span>
                        {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-gold-soft/60" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      {user && (
        <div className="relative px-5 py-5 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 text-initials text-sm"
              style={{ background: roleColors?.bg || "rgba(184,155,74,0.12)", color: roleColors?.text || "#9A7F35" }}
            >
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-xs text-ivory-cream font-medium truncate leading-tight">
                {user.name}
              </div>
              <div
                className="font-body text-xs tracking-[0.2em] uppercase mt-0.5"
                style={{ color: roleColors?.text || "#9A7F35" }}
              >
                {roleLabel}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
            <div className="w-1.5 h-1.5 rounded-full bg-maritime-success" />
            <span className="font-body text-xs tracking-[0.2em] uppercase text-ivory-cream/50">
              System Online · v2.4.1
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
