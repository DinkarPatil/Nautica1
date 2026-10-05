"use client";

import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Crosshair,
  Anchor,
  ArrowRight,
  Activity,
  Radar,
  Brain,
  LayoutDashboard,
  Cpu,
  Ship,
  Globe2,
  Compass,
  ShieldCheck,
  Network,
  Route,
  Target,
  Workflow,
  Shield,
  Building2,
  Fuel,
  Truck,
  Satellite,
  Gauge,
  ChevronRight,
} from "lucide-react";

// ─── Primitives ─────────────────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className,
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Section({
  id,
  children,
  className = "",
  divider = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  divider?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative ${
        divider ? "border-t border-ivory-cream/[0.06]" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <span className="block w-8 h-px bg-gold-muted/60" />
      <span className="font-body text-[11px] tracking-[0.4em] uppercase text-gold-soft/80">
        {children}
      </span>
      <span className="block w-8 h-px bg-gold-muted/60" />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <FadeIn className="text-center mb-16 max-w-3xl mx-auto">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2
        className="font-display text-ivory-cream text-balance"
        style={{
          fontSize: "clamp(1.85rem, 3.4vw, 2.75rem)",
          fontWeight: 300,
          letterSpacing: "-0.018em",
          lineHeight: 1.08,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="font-body text-base text-greige max-w-2xl mx-auto leading-relaxed mt-5">
          {subtitle}
        </p>
      )}
    </FadeIn>
  );
}

type ButtonVariant = "primary" | "secondary";
function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  className?: string;
}) {
  const sizing =
    size === "lg" ? "px-10 py-4 text-sm" : "px-8 py-3.5 text-[13px]";
  const styles =
    variant === "primary"
      ? "bg-gold-muted hover:bg-gold-soft text-noir"
      : "border border-ivory-cream/20 hover:border-gold-muted/60 text-ivory-cream hover:text-gold-soft";
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2.5 font-body tracking-[0.18em] uppercase transition-all duration-300 ${sizing} ${styles} ${className}`}
      style={{ fontWeight: 500 }}
    >
      {children}
      <ArrowRight
        size={13}
        className="group-hover:translate-x-0.5 transition-transform"
      />
    </Link>
  );
}

function Card({
  children,
  className = "",
  interactive = true,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`group relative border border-ivory-cream/[0.08] bg-ivory-cream/[0.015] ${
        interactive
          ? "hover:border-gold-muted/40 hover:bg-gold-muted/[0.03] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(201,169,98,0.22)] transition-all duration-300"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function CountUp({
  to,
  suffix = "",
  decimals = 0,
  duration = 1.8,
}: {
  to: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    decimals === 0
      ? Math.round(v).toLocaleString()
      : v.toFixed(decimals)
  );
  const [text, setText] = useState(decimals === 0 ? "0" : (0).toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = display.on("change", (v) => setText(String(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, to, duration, mv, display]);

  return (
    <span ref={ref} className="tabular-nums">
      {text}
      {suffix}
    </span>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="relative z-30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Crosshair size={20} className="text-gold-muted" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base text-ivory-cream tracking-wide">
              GlimmoraNautica
            </span>
            <span className="font-body text-[10px] tracking-[0.35em] uppercase text-gold-soft/60 mt-0.5">
              Est. MMXXVI
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {[
            { label: "Platform", href: "#platform" },
            { label: "Flow", href: "#flow" },
            { label: "Capabilities", href: "#capabilities" },
            { label: "Use Cases", href: "#use-cases" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-body text-[11px] tracking-[0.25em] uppercase text-greige hover:text-ivory-cream transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 border border-gold-muted/40 text-ivory-cream hover:bg-gold-muted/10 hover:border-gold-muted/70 font-body text-[11px] tracking-[0.22em] uppercase px-5 py-2.5 transition-all"
        >
          Sign In
          <ArrowRight size={12} />
        </Link>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

const heroStagger: Variants = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Radar backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative"
          style={{ width: "min(80vw, 1100px)", aspectRatio: "1 / 1" }}
        >
          {[1, 0.78, 0.58, 0.4, 0.24].map((s, i) => (
            <div
              key={i}
              className="absolute inset-0 m-auto rounded-full border border-gold-muted/15"
              style={{
                width: `${s * 100}%`,
                height: `${s * 100}%`,
                borderStyle: i % 2 === 0 ? "dashed" : "solid",
                opacity: 0.28 - i * 0.03,
              }}
            />
          ))}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gold-muted/[0.08]" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gold-muted/[0.08]" />
        </div>
      </div>

      {/* Fine grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,169,98,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,98,0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #FAF8F5 0px, #FAF8F5 1px, transparent 0px, transparent 60%)",
          backgroundSize: "10px 10px",
        }}
      />

      <motion.div
        variants={heroStagger}
        initial="hidden"
        animate="show"
        className="relative max-w-5xl mx-auto px-6 lg:px-12 pt-16 pb-32 text-center"
      >
        <motion.div variants={heroItem}>
          <div className="inline-flex items-center gap-2.5 border border-gold-muted/30 bg-gold-muted/[0.06] px-4 py-2 mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-soft opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-muted" />
            </span>
            <span className="font-body text-[11px] tracking-[0.3em] uppercase text-gold-soft/90">
              Live · Sovereign Maritime AGI
            </span>
          </div>
        </motion.div>

        <motion.h1
          variants={heroItem}
          className="font-display text-ivory-cream mb-6 text-balance"
          style={{
            fontSize: "clamp(2.75rem, 6.2vw, 5.5rem)",
            fontWeight: 300,
            letterSpacing: "-0.028em",
            lineHeight: 1.0,
          }}
        >
          AI-Powered Maritime
          <br />
          <span style={{ color: "#C9A962" }}>Intelligence Platform</span>
        </motion.h1>

        <motion.div
          variants={heroItem}
          className="flex items-center justify-center gap-3 my-7"
        >
          <span className="block w-12 h-px bg-gold-muted/50" />
          <Anchor size={14} className="text-gold-muted/80" />
          <span className="block w-12 h-px bg-gold-muted/50" />
        </motion.div>

        <motion.p
          variants={heroItem}
          className="font-body text-base md:text-lg text-greige max-w-2xl mx-auto leading-relaxed mb-12"
          style={{ letterSpacing: "0.005em" }}
        >
          Real-time decision-making across global fleet and port networks.
          Sovereign-grade vessel tracking, sanctions intelligence, and
          autonomous route optimization — unified under one command surface.
        </motion.p>

        <motion.div
          variants={heroItem}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button href="/login" variant="primary">
            Enter Command Center
          </Button>
          <Button href="/dashboard" variant="secondary">
            View Live Demo
          </Button>
        </motion.div>

        <motion.div
          variants={heroItem}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-10 max-w-3xl mx-auto pt-10 border-t border-gold-muted/15"
        >
          {[
            { icon: Compass, label: "HDG", value: "248°" },
            { icon: Activity, label: "SPD", value: "14.2 kn" },
            { icon: Ship, label: "Vessels", value: "100+" },
            { icon: Globe2, label: "Ports", value: "20" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-center gap-3">
              <Icon size={14} className="text-gold-muted" />
              <span className="font-body text-[10px] tracking-[0.3em] uppercase text-gold-soft/70">
                {label}
              </span>
              <span className="font-body text-sm text-ivory-cream/90 tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Platform Overview ─────────────────────────────────────────────────────

const platformCards = [
  {
    icon: Network,
    title: "Fleet Intelligence",
    desc: "Live position, behavior, and exposure across every vessel under command.",
    tag: "Module 01",
  },
  {
    icon: Building2,
    title: "Port Analytics",
    desc: "Congestion, queue forecasts, and berth availability across sovereign ports.",
    tag: "Module 02",
  },
  {
    icon: ShieldCheck,
    title: "Sanctions Engine",
    desc: "Continuous screening against OFAC, EU, UN, and watch-list registries.",
    tag: "Module 03",
  },
  {
    icon: Route,
    title: "Route Optimization",
    desc: "AGI-derived courses balancing cost, weather, ETA, and geopolitical risk.",
    tag: "Module 04",
  },
];

function PlatformOverview() {
  return (
    <Section id="platform">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-28">
        <SectionHeading
          eyebrow="Platform Overview"
          title="One surface. Every layer of maritime command."
          subtitle="Four sovereign modules, fused into a single decision surface — built for command teams, not analysts."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {platformCards.map(({ icon: Icon, title, desc, tag }, i) => (
            <FadeIn key={title} delay={i * 0.08}>
              <Card className="p-7 h-full">
                <div className="flex items-center justify-between mb-7">
                  <div className="w-11 h-11 rounded-sm border border-gold-muted/30 bg-gold-muted/[0.06] flex items-center justify-center">
                    <Icon
                      size={18}
                      className="text-gold-muted"
                      strokeWidth={1.4}
                    />
                  </div>
                  <span className="font-body text-[10px] tracking-[0.3em] uppercase text-gold-soft/60">
                    {tag}
                  </span>
                </div>
                <h3
                  className="font-display text-ivory-cream mb-3"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 400,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {title}
                </h3>
                <p className="font-body text-[13px] text-greige leading-relaxed">
                  {desc}
                </p>
                <div className="flex items-center gap-2 mt-7 text-gold-muted/70 group-hover:text-gold-soft transition-colors">
                  <span className="font-body text-[10px] tracking-[0.28em] uppercase">
                    Explore
                  </span>
                  <ChevronRight size={12} />
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────

const flowSteps = [
  {
    icon: Satellite,
    label: "Data Ingestion",
    desc: "AIS, satellite, port feeds, weather, and sanctions registries — fused continuously.",
  },
  {
    icon: Brain,
    label: "AI Processing Engine",
    desc: "Multi-model reasoning over telemetry, with confidence scoring and audit trails.",
  },
  {
    icon: Target,
    label: "Risk & Optimization",
    desc: "Anomalies, exposure, and routing trade-offs surfaced in real time.",
  },
  {
    icon: LayoutDashboard,
    label: "Command Center Output",
    desc: "Operators see only what matters — with one-click execution paths.",
  },
];

function HowItWorks() {
  return (
    <Section id="flow">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-28">
        <SectionHeading
          eyebrow="How It Works"
          title="From signal to sovereign action."
          subtitle="A four-stage pipeline that turns global maritime telemetry into decisions in milliseconds."
        />

        <div className="relative">
          <div
            className="hidden md:block absolute top-7 left-[12%] right-[12%] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(201,169,98,0.45) 20%, rgba(201,169,98,0.45) 80%, transparent 100%)",
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-x-6 relative">
            {flowSteps.map(({ icon: Icon, label, desc }, i) => (
              <FadeIn key={label} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center group">
                  <div
                    className="relative w-14 h-14 rounded-full border border-gold-muted/40 flex items-center justify-center bg-noir/80 backdrop-blur-sm transition-all group-hover:border-gold-muted group-hover:shadow-[0_0_24px_rgba(201,169,98,0.25)]"
                    style={{ boxShadow: "0 0 0 6px rgba(5,11,20,1)" }}
                  >
                    <Icon
                      size={20}
                      className="text-gold-muted"
                      strokeWidth={1.4}
                    />
                  </div>
                  <div className="font-body text-[10px] tracking-[0.3em] uppercase text-gold-soft/60 mt-5 mb-2">
                    Step 0{i + 1}
                  </div>
                  <h3
                    className="font-display text-ivory-cream mb-2"
                    style={{ fontSize: "1.2rem", fontWeight: 400 }}
                  >
                    {label}
                  </h3>
                  <p className="font-body text-[13px] text-greige leading-relaxed max-w-[230px]">
                    {desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

// ─── AI Capabilities ───────────────────────────────────────────────────────

const capabilities = [
  {
    icon: Route,
    title: "Predictive Routing",
    desc: "Forecasted ETAs, fuel curves, and weather-aware course recommendations across every voyage.",
    metric: "12.4ms",
    metricLabel: "Decision Latency",
  },
  {
    icon: Radar,
    title: "Risk Detection",
    desc: "Anomaly models flag dark voyages, AIS spoofing, and behavior outside fleet baselines.",
    metric: "99.4%",
    metricLabel: "Recall on Spoofing",
  },
  {
    icon: Shield,
    title: "Sanctions Intelligence",
    desc: "Continuous screening against OFAC, EU, UN, and proprietary watchlists — with provenance.",
    metric: "6 Sec",
    metricLabel: "Registry Sync",
  },
  {
    icon: Workflow,
    title: "Fleet Optimization",
    desc: "Whole-fleet reasoning balances charter terms, port queues, and bunker price curves.",
    metric: "11.6%",
    metricLabel: "Avg. Fuel Saved",
  },
];

function AICapabilities() {
  return (
    <Section id="capabilities">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-28">
        <SectionHeading
          eyebrow="AI Capabilities"
          title="Reasoning across every layer of the maritime stack."
          subtitle="The Core ingests telemetry from every vessel, port, and intelligence feed — synthesizing decisions in milliseconds."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {capabilities.map(
            ({ icon: Icon, title, desc, metric, metricLabel }, i) => (
              <FadeIn key={title} delay={i * 0.08}>
                <Card className="p-8 h-full">
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 w-12 h-12 rounded-sm border border-gold-muted/30 bg-gold-muted/[0.06] flex items-center justify-center">
                      <Icon
                        size={20}
                        className="text-gold-muted"
                        strokeWidth={1.4}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-4 mb-3">
                        <h3
                          className="font-display text-ivory-cream"
                          style={{
                            fontSize: "1.35rem",
                            fontWeight: 400,
                            letterSpacing: "-0.005em",
                          }}
                        >
                          {title}
                        </h3>
                        <span className="font-body text-[10px] tracking-[0.3em] uppercase text-gold-soft/60">
                          AGI
                        </span>
                      </div>
                      <p className="font-body text-[13.5px] text-greige leading-relaxed mb-7">
                        {desc}
                      </p>
                      <div className="flex items-center gap-6 pt-5 border-t border-ivory-cream/[0.06]">
                        <div>
                          <div
                            className="font-display text-ivory-cream tabular-nums"
                            style={{
                              fontSize: "1.4rem",
                              fontWeight: 400,
                              letterSpacing: "-0.015em",
                            }}
                          >
                            {metric}
                          </div>
                          <div className="font-body text-[10px] tracking-[0.28em] uppercase text-gold-soft/60 mt-1">
                            {metricLabel}
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-gold-muted/70">
                          <span className="font-body text-[10px] tracking-[0.28em] uppercase">
                            View Engine
                          </span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            )
          )}
        </div>
      </div>
    </Section>
  );
}

// ─── Product Preview (Mock Dashboard) ──────────────────────────────────────

function MockDashboard() {
  return (
    <div className="relative w-full">
      {/* Glow halo */}
      <div
        className="absolute -inset-x-20 -inset-y-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,169,98,0.12) 0%, transparent 60%)",
        }}
      />

      <div
        className="relative border border-gold-muted/25 bg-noir/70 backdrop-blur-sm overflow-hidden"
        style={{
          boxShadow:
            "0 60px 120px -40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,169,98,0.04), inset 0 1px 0 rgba(201,169,98,0.08)",
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ivory-cream/[0.06] bg-noir/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-ivory-cream/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-ivory-cream/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-ivory-cream/15" />
          </div>
          <div className="flex items-center gap-2">
            <Crosshair size={12} className="text-gold-muted/80" />
            <span className="font-body text-[10px] tracking-[0.28em] uppercase text-gold-soft/70">
              GlimmoraNautica · Command Center
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-maritime-success-soft opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-maritime-success-soft" />
            </span>
            <span className="font-body text-[10px] tracking-[0.25em] uppercase text-greige">
              Live
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 gap-px bg-ivory-cream/[0.05] min-h-[440px]">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col col-span-2 bg-noir/80 p-5 gap-1">
            {[
              { icon: LayoutDashboard, label: "Bridge", active: true },
              { icon: Ship, label: "Fleet" },
              { icon: Globe2, label: "Ports" },
              { icon: Radar, label: "Risk" },
              { icon: Route, label: "Routing" },
              { icon: Shield, label: "Sanctions" },
              { icon: Cpu, label: "AGI Core" },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-2.5 py-2 ${
                  active
                    ? "border-l border-gold-muted text-ivory-cream bg-gold-muted/[0.05]"
                    : "border-l border-transparent text-greige"
                }`}
              >
                <Icon size={12} strokeWidth={1.4} />
                <span className="font-body text-[10px] tracking-[0.18em] uppercase">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="col-span-12 md:col-span-7 bg-noir/60 p-5">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Vessels", value: "1,284" },
                { label: "Active Ports", value: "20" },
                { label: "Alerts", value: "07" },
                { label: "Eff.", value: "94%" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="border border-ivory-cream/[0.06] p-3"
                >
                  <div className="font-body text-[9px] tracking-[0.28em] uppercase text-gold-soft/60 mb-1">
                    {s.label}
                  </div>
                  <div
                    className="font-display text-ivory-cream tabular-nums"
                    style={{ fontSize: "1.05rem", fontWeight: 400 }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div
              className="relative border border-ivory-cream/[0.06] h-[260px] overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 40%, rgba(201,169,98,0.06) 0%, transparent 55%), linear-gradient(180deg, rgba(10,17,30,0.6) 0%, rgba(5,11,20,0.6) 100%)",
              }}
            >
              {/* Latitude lines */}
              {[20, 40, 60, 80].map((p) => (
                <div
                  key={`lat-${p}`}
                  className="absolute left-0 right-0 h-px bg-ivory-cream/[0.05]"
                  style={{ top: `${p}%` }}
                />
              ))}
              {/* Longitude lines */}
              {[15, 35, 55, 75].map((p) => (
                <div
                  key={`lon-${p}`}
                  className="absolute top-0 bottom-0 w-px bg-ivory-cream/[0.05]"
                  style={{ left: `${p}%` }}
                />
              ))}

              {/* Vessel dots */}
              {[
                { x: 18, y: 30 },
                { x: 32, y: 55 },
                { x: 48, y: 38 },
                { x: 62, y: 64 },
                { x: 75, y: 28 },
                { x: 82, y: 50 },
                { x: 24, y: 72 },
                { x: 56, y: 22 },
              ].map((v, i) => (
                <span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-gold-muted"
                  style={{
                    left: `${v.x}%`,
                    top: `${v.y}%`,
                    boxShadow: "0 0 8px rgba(201,169,98,0.7)",
                  }}
                />
              ))}

              {/* Active vessel — pulsing */}
              <span
                className="absolute w-2 h-2 rounded-full bg-gold-soft animate-ping"
                style={{ left: "44%", top: "46%" }}
              />
              <span
                className="absolute w-2 h-2 rounded-full bg-gold-soft"
                style={{
                  left: "44%",
                  top: "46%",
                  boxShadow: "0 0 16px rgba(201,169,98,0.9)",
                }}
              />

              {/* Route trail */}
              <svg className="absolute inset-0 w-full h-full">
                <path
                  d="M 18% 30% Q 35% 50%, 44% 46% T 75% 28%"
                  stroke="rgba(201,169,98,0.5)"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                  fill="none"
                />
              </svg>

              {/* Bottom legend */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-body text-[9px] tracking-[0.25em] uppercase text-gold-soft/60">
                <span>North Atlantic · 14:22 UTC</span>
                <span>Zoom · 1.0x</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="hidden md:flex flex-col col-span-3 bg-noir/80 p-5 gap-3">
            <div>
              <div className="font-body text-[9px] tracking-[0.3em] uppercase text-gold-soft/60 mb-3">
                Live Alerts
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    sev: "high",
                    title: "AIS Loss · MV Auriga",
                    sub: "Dark for 47 min · Strait of Hormuz",
                  },
                  {
                    sev: "med",
                    title: "Sanctions match",
                    sub: "Vessel of interest · Corinth",
                  },
                  {
                    sev: "low",
                    title: "Weather divergence",
                    sub: "Force 7 · Bay of Biscay",
                  },
                ].map((a) => (
                  <div
                    key={a.title}
                    className="border-l border-gold-muted/40 pl-3"
                  >
                    <div className="font-body text-[11px] text-ivory-cream/90">
                      {a.title}
                    </div>
                    <div className="font-body text-[10px] text-greige mt-0.5">
                      {a.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <div className="font-body text-[9px] tracking-[0.3em] uppercase text-gold-soft/60 mb-3">
                AGI Output
              </div>
              <div className="border border-gold-muted/25 bg-gold-muted/[0.04] p-3">
                <div className="font-body text-[10px] tracking-[0.2em] uppercase text-gold-soft/80 mb-1.5">
                  Recommendation
                </div>
                <div className="font-body text-[11px] text-ivory-cream/90 leading-snug">
                  Reroute MV Auriga via 24°N. ETA −6h, fuel −4.2%, exposure
                  cleared.
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-ivory-cream/[0.06]">
                  <span className="font-body text-[9px] tracking-[0.25em] uppercase text-gold-soft/60">
                    Conf · 0.92
                  </span>
                  <span className="font-body text-[9px] tracking-[0.25em] uppercase text-ivory-cream/80">
                    Approve →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <Section id="preview">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-28">
        <SectionHeading
          eyebrow="Product Preview"
          title="Unified Maritime Command Center"
          subtitle="Every vessel, port, alert, and AGI recommendation — composed onto a single sovereign surface."
        />

        <FadeIn>
          <MockDashboard />
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                icon: Eye,
                title: "Single Pane",
                desc: "Map, fleet, ports, risk, and AGI fused into one surface.",
              },
              {
                icon: Gauge,
                title: "Real-Time Telemetry",
                desc: "Sub-second refresh across AIS, weather, and registry feeds.",
              },
              {
                icon: ShieldCheck,
                title: "Audit-Grade",
                desc: "Every AGI action logged with provenance and confidence.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 border-t border-ivory-cream/[0.06] pt-5"
              >
                <Icon
                  size={16}
                  className="text-gold-muted mt-0.5 shrink-0"
                  strokeWidth={1.4}
                />
                <div>
                  <div className="font-display text-ivory-cream text-[15px] mb-1">
                    {title}
                  </div>
                  <div className="font-body text-[12.5px] text-greige leading-relaxed">
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

// Eye icon import workaround — using a small custom for the explainer line
function Eye({
  size = 16,
  className = "",
  strokeWidth = 1.5,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Use Cases ─────────────────────────────────────────────────────────────

const useCases = [
  {
    icon: Shield,
    title: "Naval Defense",
    desc: "Sovereign-grade situational awareness, dark-vessel detection, and chokepoint monitoring for state actors.",
  },
  {
    icon: Truck,
    title: "Logistics & Shipping",
    desc: "Charter optimization, ETA precision, and exposure screening for global carriers and forwarders.",
  },
  {
    icon: Building2,
    title: "Port Authorities",
    desc: "Berth allocation, congestion forecasting, and vessel-of-interest screening at sovereign ports.",
  },
  {
    icon: Fuel,
    title: "Energy & Offshore",
    desc: "Asset tracking, supply-chain assurance, and routing across LNG, crude, and offshore platforms.",
  },
];

function UseCases() {
  return (
    <Section id="use-cases">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-28">
        <SectionHeading
          eyebrow="Use Cases"
          title="Trusted across the maritime command spectrum."
          subtitle="From sovereign navies to global carriers — one platform, four operating doctrines."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {useCases.map(({ icon: Icon, title, desc }, i) => (
            <FadeIn key={title} delay={i * 0.08}>
              <Card className="p-8 h-full">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-sm border border-gold-muted/30 bg-gold-muted/[0.06] flex items-center justify-center">
                    <Icon
                      size={20}
                      className="text-gold-muted"
                      strokeWidth={1.4}
                    />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-display text-ivory-cream mb-3"
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 400,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {title}
                    </h3>
                    <p className="font-body text-[13.5px] text-greige leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Live Metrics Strip ────────────────────────────────────────────────────

const metrics = [
  { value: 12480, suffix: "+", label: "Vessels Tracked" },
  { value: 280, suffix: "", label: "Active Ports" },
  { value: 3742, suffix: "", label: "Risk Alerts / Day" },
  { value: 94.6, suffix: "%", label: "Routing Efficiency", decimals: 1 },
];

function MetricsStrip() {
  return (
    <Section
      id="metrics"
      className="overflow-hidden"
      divider
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,169,98,0.08) 0%, transparent 60%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 lg:px-12 py-24">
        <SectionHeading
          eyebrow="Live Network"
          title="Operating at sovereign scale."
          subtitle="A live snapshot of activity across the GlimmoraNautica intelligence network."
        />

        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gold-muted/15 border border-gold-muted/15">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="bg-noir/60 backdrop-blur-sm py-10 px-6 text-center"
              >
                <div
                  className="font-display text-ivory-cream mb-3"
                  style={{
                    fontSize: "clamp(2.25rem, 4vw, 3.25rem)",
                    fontWeight: 400,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                  }}
                >
                  <CountUp
                    to={m.value}
                    suffix={m.suffix}
                    decimals={m.decimals ?? 0}
                  />
                </div>
                <div className="font-body text-[10px] tracking-[0.32em] uppercase text-gold-soft/70">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <Section id="cta" className="overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(201,169,98,0.08) 0%, transparent 65%)",
        }}
      />

      {/* Decorative concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
        <div
          className="relative"
          style={{ width: "min(70vw, 900px)", aspectRatio: "1 / 1" }}
        >
          {[1, 0.7, 0.45].map((s, i) => (
            <div
              key={i}
              className="absolute inset-0 m-auto rounded-full border border-gold-muted/15"
              style={{
                width: `${s * 100}%`,
                height: `${s * 100}%`,
                borderStyle: "dashed",
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-12 py-32 text-center">
        <FadeIn>
          <SectionLabel>Sovereign Access</SectionLabel>
          <h2
            className="font-display text-ivory-cream mb-8 text-balance"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 4rem)",
              fontWeight: 300,
              letterSpacing: "-0.028em",
              lineHeight: 1.02,
            }}
          >
            Take Command of
            <br />
            <span style={{ color: "#C9A962" }}>
              Global Maritime Intelligence.
            </span>
          </h2>

          <p className="font-body text-base text-greige max-w-xl mx-auto leading-relaxed mb-10">
            Step onto the bridge. Every vessel, every port, every decision —
            under one sovereign command surface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/login" variant="primary" size="lg">
              Enter Command Center
            </Button>
            <Button href="/dashboard" variant="secondary" size="lg">
              Request Demo
            </Button>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-ivory-cream/[0.06]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Crosshair size={16} className="text-gold-muted" />
          <span className="font-display text-sm text-ivory-cream tracking-wide">
            GlimmoraNautica
          </span>
          <span className="font-body text-[10px] tracking-[0.3em] uppercase text-gold-soft/50 ml-2">
            Est. MMXXVI
          </span>
        </div>

        <div className="flex items-center gap-7">
          {["Platform", "Intelligence", "Security", "Contact"].map((l) => (
            <a
              key={l}
              href="#"
              className="font-body text-[11px] tracking-[0.2em] uppercase text-greige hover:text-gold-soft transition-colors"
            >
              {l}
            </a>
          ))}
        </div>

        <p className="font-body text-[11px] text-greige/70 tracking-wide">
          © 2026 GlimmoraNautica. Sovereign-grade.
        </p>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className="h-screen overflow-y-auto overflow-x-hidden text-ivory-cream scroll-smooth"
      style={{
        background:
          "linear-gradient(180deg, #050B14 0%, #0A111E 50%, #050B14 100%)",
      }}
    >
      <Header />
      <HeroSection />
      <PlatformOverview />
      <HowItWorks />
      <AICapabilities />
      <ProductPreview />
      <UseCases />
      <MetricsStrip />
      <FinalCTA />
      <Footer />
    </div>
  );
}
