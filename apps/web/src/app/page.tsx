"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ─── Data ───────────────────────────────────────────────────────────────────

const JAVA_LINES = [
  "@Entity",
  '@Table(name = "orders")',
  "public class Order extends BaseEntity {",
  "",
  "  @Column(nullable = false)",
  "  private Long userId;",
  "",
  "  @Enumerated(EnumType.STRING)",
  "  @Column(nullable = false)",
  "  private OrderStatus status;",
  "",
  "  @ManyToOne",
  '  @JoinColumn(name = "customer_id")',
  "  private Customer customer;",
  "}",
];

const TS_LINES = [
  "// schema.prisma",
  "model Order {",
  "  id         BigInt      @id @default(autoincrement())",
  "  userId     BigInt",
  "  status     OrderStatus",
  "  customerId Int",
  "  customer   Customer    @relation(...)",
  '  @@map("orders")',
  "}",
  "",
  "// order.schema.ts",
  "export const OrderSchema = z.object({",
  "  id: z.number().optional(),",
  "  userId: z.number(),",
  "  status: z.nativeEnum(OrderStatus),",
  "});",
];

const STEREOTYPES = [
  { from: "@Entity", to: "Zod schema + Prisma model" },
  { from: "@Service", to: "NestJS @Injectable" },
  { from: "@RestController", to: "NestJS @Controller" },
  { from: "@Repository", to: "Prisma service stub" },
  { from: "Dto class", to: "TypeScript interface + Zod" },
  { from: "enum", to: "TypeScript enum + Prisma enum" },
  { from: "@MappedSuperclass", to: "inherited fields" },
  { from: "JPA Relations", to: "Prisma @relation" },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get started and explore the converter.",
    features: [
      "2 conversions/day",
      "Download output as ZIP",
      "Community support",
    ],
    cta: "Try Free",
    ctaHref: "/converter",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    badge: "Most Popular",
    description: "For developers doing serious migrations.",
    features: [
      "Unlimited conversions",
      "Full project upload (ZIP)",
      "CLI tool access",
    ],
    cta: "Start Pro Trial",
    ctaHref: "/converter",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "For engineering teams migrating at scale.",
    features: ["Everything in Pro", "Github Integration", "Dedicated support"],
    cta: "Contact Sales",
    ctaHref: "mailto:sales@transmuter.ai",
    highlighted: false,
  },
];

// ─── Animated Terminal Demo ──────────────────────────────────────────────────

type DemoPhase = "java" | "converting" | "typescript" | "reset";

function AnimatedTerminal() {
  const [phase, setPhase] = useState<DemoPhase>("java");
  const [visibleJavaLines, setVisibleJavaLines] = useState(0);
  const [visibleTsLines, setVisibleTsLines] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "java") {
      // Reveal Java lines one by one, ~120ms per line
      if (visibleJavaLines < JAVA_LINES.length) {
        timeout = setTimeout(() => {
          setVisibleJavaLines((n) => n + 1);
        }, 120);
      } else {
        // All lines shown — wait then go to converting
        timeout = setTimeout(() => setPhase("converting"), 1800);
      }
    } else if (phase === "converting") {
      timeout = setTimeout(() => {
        setPhase("typescript");
      }, 1500);
    } else if (phase === "typescript") {
      if (visibleTsLines < TS_LINES.length) {
        timeout = setTimeout(() => {
          setVisibleTsLines((n) => n + 1);
        }, 90);
      } else {
        // All TS lines shown — wait then reset
        timeout = setTimeout(() => setPhase("reset"), 3000);
      }
    } else if (phase === "reset") {
      timeout = setTimeout(() => {
        setVisibleJavaLines(0);
        setVisibleTsLines(0);
        setPhase("java");
      }, 400);
    }

    return () => clearTimeout(timeout);
  }, [phase, visibleJavaLines, visibleTsLines]);

  const isConverting = phase === "converting";
  const showTs = phase === "typescript" || phase === "reset";

  return (
    <div className="w-full max-w-5xl mx-auto mt-16 mb-16">
      <div className="rounded-2xl border border-white/[0.07] bg-gray-900/60 backdrop-blur-sm overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]">
        {/* Terminal chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <span className="w-3 h-3 rounded-full bg-red-500/50" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <span className="w-3 h-3 rounded-full bg-green-500/50" />
          <span className="ml-4 text-xs text-gray-500 font-mono">
            transmuter — live preview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
          {/* Left: Java input */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-orange-400/70">
                Input — Java
              </span>
              <span className="ml-auto text-[10px] font-mono text-gray-600">
                Order.java
              </span>
            </div>
            <pre className="text-xs font-mono leading-6 text-gray-300 min-h-[240px]">
              {JAVA_LINES.slice(0, visibleJavaLines).map((line, i) => (
                <div key={i} className="whitespace-pre">
                  <span className="select-none text-gray-600 mr-3 text-[10px]">
                    {String(i + 1).padStart(2, " ")}
                  </span>
                  <span
                    className={
                      line.startsWith("@")
                        ? "text-cyan-400"
                        : line.startsWith("  @")
                          ? "text-cyan-400"
                          : line.includes("private")
                            ? "text-violet-300"
                            : line.includes("public class")
                              ? "text-blue-300"
                              : "text-gray-300"
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
              {visibleJavaLines < JAVA_LINES.length && phase === "java" && (
                <div className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-8" />
              )}
            </pre>
          </div>

          {/* Right: output or converting state */}
          <div className="p-5 relative">
            {isConverting ? (
              <div className="flex flex-col items-center justify-center min-h-[240px] gap-4">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-violet-400 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="text-sm text-violet-300 font-mono animate-pulse">
                    Analysing AST...
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-mono space-y-1 text-center">
                  <div>Parsing annotations</div>
                  <div>Resolving relations</div>
                  <div>Mapping types</div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-400/70">
                    Output — TypeScript
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-gray-600">
                    order.schema.ts
                  </span>
                </div>
                <pre className="text-xs font-mono leading-6 min-h-[240px]">
                  {showTs &&
                    TS_LINES.slice(0, visibleTsLines).map((line, i) => (
                      <div key={i} className="whitespace-pre">
                        <span className="select-none text-gray-600 mr-3 text-[10px]">
                          {String(i + 1).padStart(2, " ")}
                        </span>
                        <span
                          className={
                            line.startsWith("//")
                              ? "text-gray-500"
                              : line.includes("z.object") ||
                                  line.includes("z.number") ||
                                  line.includes("z.nativeEnum")
                                ? "text-emerald-400"
                                : line.startsWith("model") ||
                                    line.startsWith("export")
                                  ? "text-blue-300"
                                  : line.includes("@id") ||
                                      line.includes("@default") ||
                                      line.includes("@relation") ||
                                      line.includes("@@map")
                                    ? "text-violet-400"
                                    : "text-gray-300"
                          }
                        >
                          {line}
                        </span>
                      </div>
                    ))}
                  {showTs && visibleTsLines < TS_LINES.length && (
                    <div className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-8" />
                  )}
                </pre>
              </>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-5 py-2.5 border-t border-white/[0.05] bg-white/[0.01] flex items-center gap-3">
          <span
            className={`w-2 h-2 rounded-full ${
              isConverting
                ? "bg-yellow-400 animate-pulse"
                : phase === "typescript"
                  ? "bg-emerald-400"
                  : "bg-cyan-400"
            }`}
          />
          <span className="text-[11px] font-mono text-gray-500">
            {isConverting
              ? "Converting..."
              : phase === "typescript" || phase === "reset"
                ? "Conversion complete — 0 errors, 0 warnings"
                : "Reading Java source..."}
          </span>
          <span className="ml-auto text-[11px] font-mono text-gray-600">
            deterministic · no LLM
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  function handleWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (email.trim()) {
      setWaitlistSubmitted(true);
    }
  }

  return (
    <div className="relative bg-gray-950">
      {/* ─── STICKY NAV ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.05] bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          {/* Wordmark */}
          <Link
            href="/"
            className="text-base font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-violet-500 bg-clip-text text-transparent font-[family-name:var(--font-syne)] tracking-tight shrink-0"
          >
            Transmuter.ai
          </Link>

          {/* Center links */}
          <div className="hidden sm:flex items-center gap-8">
            <a
              href="#demo"
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Converter
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-400 hover:text-gray-100 transition-colors"
            >
              Pricing
            </a>
          </div>

          {/* CTA */}
          <Link
            href="/converter"
            className="shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all"
          >
            Try Free
          </Link>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[900px] h-[600px] rounded-full bg-violet-700/10 blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[400px] rounded-full bg-cyan-600/8 blur-[100px]" />
        </div>

        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex mt-4 items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-400 text-xs font-medium mb-10 animate-fade-in">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
            </span>
            AST-Powered · Multi-Stereotype · No Hallucinations
          </div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.0] font-[family-name:var(--font-syne)] animate-fade-in-up">
            <span className="text-white">Migrate your entire</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-violet-500 bg-clip-text text-transparent">
              Spring Boot project.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.15s", animationFillMode: "both" }}
          >
            Transmuter.ai reads your actual Java source — entities, services,
            controllers, DTOs, enums — and generates production-ready{" "}
            <span className="text-gray-200">TypeScript</span>,{" "}
            <span className="text-gray-200">NestJS</span>,{" "}
            <span className="text-gray-200">Zod schemas</span> and{" "}
            <span className="text-gray-200">Prisma models</span>. No prompts. No
            guessing.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <Link
              href="/converter"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-base transition-all hover:shadow-[0_0_50px_rgba(139,92,246,0.35)] hover:scale-[1.02]"
            >
              Try the Converter
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/[0.09] text-gray-300 font-medium text-base hover:bg-white/[0.04] hover:border-white/[0.15] transition-all"
            >
              See how it works
            </a>
          </div>

          {/* Stats row */}
          <div
            className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 animate-fade-in-up"
            style={{ animationDelay: "0.45s", animationFillMode: "both" }}
          >
            {[
              { value: "10+", label: "stereotypes supported" },
              { value: "100%", label: "deterministic — no LLM for core" },
              { value: "∞", label: "relations resolved automatically" },
              { value: "2s", label: "average conversion time" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                {i > 0 && (
                  <span className="hidden sm:block w-px h-6 bg-white/10" />
                )}
                <div className="text-center sm:text-left">
                  <div className="text-2xl font-bold font-[family-name:var(--font-syne)] bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated terminal */}
        <div
          className="relative z-10 w-full max-w-5xl mx-auto animate-fade-in-up"
          style={{ animationDelay: "0.6s", animationFillMode: "both" }}
        >
          <AnimatedTerminal />
        </div>
      </section>

      {/* ─── WHAT GETS MIGRATED ──────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden border-y border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-gray-500 mb-10">
            Everything that gets migrated
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEREOTYPES.map((s) => (
              <div
                key={s.from}
                className="group flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.09] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {s.from}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3 h-3 text-violet-500 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                  <span className="text-xs text-gray-400">{s.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="demo" className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-400/70 mb-4">
              How it works
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-syne)] text-white tracking-tight">
              Three steps to production TypeScript
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Connector */}
            {[
              {
                step: "01",
                title: "Paste or upload",
                desc: "Drop your Java source files. Multiple classes, packages, full projects supported.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "AST analysis",
                desc: "JavaParser reads your code structure, annotations, types, and relations. Zero guessing.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                    />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Download",
                desc: "Get a ZIP with all generated TypeScript files + schema.prisma, organized by package.",
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/[0.07] text-violet-400 mb-5 group-hover:scale-110 group-hover:border-violet-500/30 transition-all">
                  {item.icon}
                </div>
                <div className="mb-1 text-[11px] font-bold tracking-widest text-gray-600">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-syne)]">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-violet-800/8 blur-[120px]" />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-violet-400/70 mb-4">
              Pricing
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-syne)] text-white tracking-tight">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto text-sm">
              Start free. Scale when you need it. No per-seat surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-7 flex flex-col gap-6 transition-all ${
                  tier.highlighted
                    ? "border border-violet-500/40 bg-violet-950/20 shadow-[0_0_40px_rgba(139,92,246,0.15)] scale-[1.03]"
                    : "border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.025] hover:border-white/[0.1]"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-gradient-to-r from-cyan-500 to-violet-600 text-white">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">
                    {tier.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold font-[family-name:var(--font-syne)] text-white">
                      {tier.price}
                    </span>
                    <span className="text-gray-500 text-sm mb-1.5">
                      {tier.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg
                        className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                      <span className="text-sm text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.ctaHref}
                  className={`block w-full py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02]"
                      : "border border-white/[0.09] text-gray-300 hover:bg-white/[0.04] hover:border-white/[0.15]"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WAITLIST / EARLY ACCESS ─────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-cyan-700/8 blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-cyan-400/70 mb-4">
            Coming soon
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-syne)] text-white tracking-tight leading-tight">
            Be first when CLI launches
          </h2>
          <p className="mt-5 text-gray-400 leading-relaxed">
            Migrate entire Spring Boot projects from your terminal. Get early
            access to the{" "}
            <code className="font-mono text-sm bg-white/[0.06] px-1.5 py-0.5 rounded text-cyan-300">
              transmuter
            </code>{" "}
            CLI.
          </p>

          <div className="mt-10">
            {waitlistSubmitted ? (
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <p className="text-emerald-400 font-semibold">
                  You&apos;re on the list!
                </p>
                <p className="text-sm text-gray-500">
                  We&apos;ll email you when the CLI is ready.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleWaitlist}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.09] text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-all whitespace-nowrap"
                >
                  Join Waitlist
                </button>
              </form>
            )}
          </div>

          {!waitlistSubmitted && (
            <p className="mt-4 text-xs text-gray-600">
              No spam. Unsubscribe anytime.
            </p>
          )}
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-sm font-bold font-[family-name:var(--font-syne)] bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Transmuter.ai
            </span>
            <span className="hidden sm:block w-px h-4 bg-white/10" />
            <span className="text-xs text-gray-600">
              Java → TypeScript migration engine
            </span>
          </div>
          <div className="flex items-center gap-6 text-gray-500 text-sm">
            <Link
              href="/converter"
              className="hover:text-gray-300 transition-colors"
            >
              Converter
            </Link>
            <a
              href="#pricing"
              className="hover:text-gray-300 transition-colors"
            >
              Pricing
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
