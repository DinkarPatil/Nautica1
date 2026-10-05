"use client";

import Link from "next/link";
import { Globe2, ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex" style={{ background: "#FAF8F5" }}>
      {/* Left panel — branding (matches login) */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #2D2A26 0%, #1A1816 100%)" }}
      >
        {/* Diagonal texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #FAF8F5 0px, #FAF8F5 1px, transparent 0px, transparent 50%)",
            backgroundSize: "10px 10px",
          }}
        />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <Globe2 size={22} className="text-gold-muted" />
            <span className="font-body text-xs tracking-[0.4em] uppercase text-gold-soft/60">
              Est. MMXXVI
            </span>
          </div>
          <div
            className="font-display text-ivory-cream mb-1"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              letterSpacing: "-0.02em",
              fontWeight: 300,
              lineHeight: 0.95,
            }}
          >
            Glimmora
          </div>
          <div
            className="font-display text-ivory-cream/60"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              letterSpacing: "-0.02em",
              fontWeight: 300,
              lineHeight: 0.95,
            }}
          >
            Nautica
          </div>
          <div className="w-14 h-px bg-gold-muted/60 mt-6 mb-5" />
          <p className="font-body text-sm text-greige leading-7 max-w-xs">
            Sovereign-grade AGI-native maritime & logistics intelligence. Planetary-scale vessel tracking, real-time sanctions screening, and autonomous route optimization.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative grid grid-cols-3 gap-8">
          {[
            { value: "100+", label: "Vessels Tracked" },
            { value: "20", label: "Global Ports" },
            { value: "99.99%", label: "Uptime SLA" },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="font-display text-ivory-cream mb-1"
                style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}
              >
                {s.value}
              </div>
              <div className="font-body text-xs tracking-[0.25em] uppercase text-greige">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — unauthorized message */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <Globe2 size={18} className="text-gold-muted" />
          <span className="font-display text-xl text-charcoal-deep tracking-[0.1em]">
            GlimmoraNautica
          </span>
        </div>

        <div className="max-w-[400px] w-full">
          <div className="w-16 h-16 rounded-sm bg-maritime-error/8 border border-maritime-error/25 flex items-center justify-center mb-6">
            <ShieldAlert size={28} className="text-maritime-error" />
          </div>

          <div className="text-label-sm text-greige mb-2">
            Access Restricted
          </div>
          <h1 className="text-h1 text-charcoal-deep mb-3">Unauthorized</h1>
          <div className="w-10 h-px bg-maritime-error/40 mb-5" />
          <p className="font-body text-sm text-charcoal-warm leading-7 mb-8">
            Your current module does not have permission to access this section. Contact Executive Command to request elevated access.
          </p>

          <Link href="/dashboard" className="btn-base btn-primary">
            <ArrowLeft size={14} />
            Return to Bridge
          </Link>
        </div>
      </div>
    </div>
  );
}
