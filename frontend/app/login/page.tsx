"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";
import { ROLE_LABELS, ROLE_COLORS } from "../types";
import {
  Crosshair,
  Anchor,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Compass,
  Gauge,
  MapPin,
  Globe2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (accountEmail: string) => {
    setError("");
    setLoading(true);
    try {
      await login(accountEmail, "demo");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto flex flex-col lg:flex-row" style={{ background: "#FAF8F5" }}>
      {/* ─── Left panel — branding + radar ─── */}
      <div
        className="hidden lg:flex lg:w-1/2 lg:min-h-screen flex-col justify-between p-16 relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/ship.png')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Radar / sonar concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: "min(78%, 720px)", aspectRatio: "1 / 1" }}>
            {[1, 0.78, 0.58, 0.4, 0.24].map((s, i) => (
              <div
                key={i}
                className="absolute inset-0 m-auto rounded-full border border-gold-muted/15"
                style={{
                  width: `${s * 100}%`,
                  height: `${s * 100}%`,
                  borderStyle: i % 2 === 0 ? "dashed" : "solid",
                  opacity: 0.35 - i * 0.04,
                }}
              />
            ))}
            {/* Crosshair lines */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gold-muted/10" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gold-muted/10" />
            {/* Center dot */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold-muted/70"
              style={{ boxShadow: "0 0 0 6px rgba(201,169,98,0.10)" }}
            />
            {/* Orbital ticks */}
            {[0, 60, 130, 200, 270, 320].map((deg) => (
              <div
                key={deg}
                className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-gold-muted/50"
                style={{
                  transform: `rotate(${deg}deg) translate(0, -28%) rotate(-${deg}deg)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Subtle grain */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #FAF8F5 0px, #FAF8F5 1px, transparent 0px, transparent 60%)",
            backgroundSize: "10px 10px",
          }}
        />

        {/* Logo + tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Crosshair size={22} className="text-gold-muted" />
            <span className="font-body text-xs tracking-[0.4em] uppercase text-gold-soft/70">
              Est. MMXXVI
            </span>
          </div>
          <div
            className="font-display text-ivory-cream"
            style={{
              fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)",
              letterSpacing: "-0.02em",
              fontWeight: 300,
              lineHeight: 0.95,
            }}
          >
            Glimmora
          </div>
          <div
            className="font-display"
            style={{
              fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)",
              letterSpacing: "-0.02em",
              fontWeight: 300,
              lineHeight: 0.95,
              color: "#C9A962",
            }}
          >
            Nautica
          </div>

          {/* Anchor divider */}
          <div className="flex items-center gap-3 mt-7 mb-6">
            <span className="block w-12 h-px bg-gold-muted/60" />
            <Anchor size={14} className="text-gold-muted/80" />
            <span className="block w-12 h-px bg-gold-muted/60" />
          </div>

          <p className="font-body text-sm text-greige leading-7 max-w-sm">
            Sovereign-grade AGI-native maritime &amp; logistics intelligence. Planetary-scale vessel tracking, real-time sanctions screening, and autonomous route optimization.
          </p>
        </div>

        {/* Bottom — instrument readings */}
        <div className="relative z-10 grid grid-cols-2 gap-y-4 gap-x-10 max-w-md">
          {[
            { icon: Compass, label: "HDG", value: "248°" },
            { icon: Gauge,   label: "SPD", value: "14.2 kn" },
            { icon: MapPin,  label: "LAT", value: "25.2041° N" },
            { icon: Globe2,  label: "LON", value: "55.2708° E" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={14} className="text-gold-muted" />
              <span className="font-body text-xs tracking-[0.3em] uppercase text-gold-soft/70">
                {label}
              </span>
              <span className="font-body text-sm text-ivory-cream/90 tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right panel — form ─── */}
      <div className="flex-1 lg:w-1/2 lg:h-screen lg:overflow-y-auto">
        <div className="min-h-full flex items-center justify-center px-6 sm:px-10 lg:px-12 py-10">
          <div className="w-full max-w-[520px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <Crosshair size={18} className="text-gold-muted" />
            <span className="font-display text-xl text-charcoal-deep tracking-[0.1em]">
              GlimmoraNautica
            </span>
          </div>
          {/* Header with shield icon */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-sm border flex items-center justify-center"
              style={{ background: "rgba(201,169,98,0.10)", borderColor: "rgba(201,169,98,0.35)" }}
            >
              <Shield size={16} className="text-gold-muted" />
            </div>
            <span className="font-body text-xs tracking-[0.3em] uppercase text-greige">
              Secure Access Portal
            </span>
          </div>
          <h1 className="text-h1 text-charcoal-deep mb-8">Sign In</h1>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="font-body text-xs tracking-[0.2em] uppercase text-stone block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/70"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@glimmora.com"
                  required
                  className="w-full font-body text-sm text-charcoal-deep placeholder:text-taupe bg-ivory-warm border border-sand pl-11 pr-5 py-3.5 outline-none focus:border-gold-muted focus:ring-1 focus:ring-gold-muted/20 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-xs tracking-[0.2em] uppercase text-stone block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone/70"
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full font-body text-sm text-charcoal-deep placeholder:text-taupe bg-ivory-warm border border-sand pl-11 pr-12 py-3.5 outline-none focus:border-gold-muted focus:ring-1 focus:ring-gold-muted/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone hover:text-charcoal-warm transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-maritime-error/8 border border-maritime-error/25 px-4 py-3">
                <p className="font-body text-xs text-maritime-error">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-charcoal-deep hover:bg-noir text-ivory-cream font-body text-sm tracking-[0.15em] uppercase py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ fontWeight: 500 }}
            >
              {loading ? "Authenticating..." : (
                <>
                  Access System
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-sand/60" />
            <span className="font-body text-xs tracking-[0.3em] uppercase text-greige">
              Demo Accounts
            </span>
            <div className="flex-1 h-px bg-sand/60" />
          </div>

          {/* Demo accounts list */}
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => {
              const roleColors = ROLE_COLORS[account.role];
              const roleLabel = ROLE_LABELS[account.role];
              return (
                <button
                  key={account.email}
                  onClick={() => quickLogin(account.email)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left group disabled:opacity-50 border border-sand/50 bg-white hover:border-gold-muted/40 hover:bg-ivory-warm transition-all duration-150"
                >
                  <div
                    className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 text-sm font-medium"
                    style={{ background: roleColors.bg, color: roleColors.text }}
                  >
                    {account.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-body text-sm text-charcoal-deep font-medium truncate">
                      {account.name}
                    </div>
                    <div className="font-body text-xs text-greige truncate mt-0.5">
                      {account.email}
                    </div>
                  </div>

                  <span
                    className="font-body text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 border flex-shrink-0"
                    style={{
                      background: roleColors.bg,
                      color: roleColors.text,
                      borderColor: roleColors.border,
                    }}
                  >
                    {roleLabel}
                  </span>
                  <ArrowRight
                    size={12}
                    className="text-stone/40 group-hover:text-gold-muted transition-colors flex-shrink-0"
                  />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-sand/60 text-center">
            <p className="font-body text-xs text-greige">
              © 2026 Glimmora Nautica. All rights reserved.
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
