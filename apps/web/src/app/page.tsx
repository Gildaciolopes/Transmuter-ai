"use client";

import Link from "next/link";
import { GridBackground } from "@/components/grid-background";
import { Particles } from "@/components/particles";
import { CodeBlock } from "@/components/code-block";

const JAVA_INPUT = `@Entity
public class User {
  @Id
  @GeneratedValue
  private Long id;

  @Column(nullable = false)
  private String email;

  private Integer age;
}`;

const ZOD_OUTPUT = `import { z } from "zod";

export const UserSchema = z.object({
  id: z.number().optional(),
  email: z.string(),
  age: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;`;

const PRISMA_OUTPUT = `model User {
  id    BigInt  @id @default(autoincrement())
  email String
  age   Int?
}`;

const FEATURES = [
  {
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
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
        />
      </svg>
    ),
    title: "AST Deterministic Parsing",
    description:
      "Structural conversion powered by JavaParser. No hallucinations — every mapping is deterministic, auditable, and reproducible.",
  },
  {
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
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
        />
      </svg>
    ),
    title: "AI for Complex Refactoring",
    description:
      "LLMs handle only what rules can't: ambiguous patterns, architectural suggestions, and fuzzy type inference. The best of both worlds.",
  },
  {
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
    title: "Zod + Prisma Output",
    description:
      "Instantly get validated TypeScript schemas (Zod) and database models (Prisma) from your JPA entities. Ready to drop into your NestJS project.",
  },
  {
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
          d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    ),
    title: "Annotation-Aware",
    description:
      "Recognizes @Entity, @Column, @Id, @GeneratedValue and maps nullable constraints, primary keys, and auto-increment strategies automatically.",
  },
  {
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
          d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"
        />
      </svg>
    ),
    title: "Microservice Architecture",
    description:
      "Parser runs as an independent Java service. Orchestrator in NestJS. Scale, replace, or extend each piece independently.",
  },
  {
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
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
        />
      </svg>
    ),
    title: "DDD-Ready",
    description:
      "Designed to recognize Bounded Contexts and domain patterns. Map entire Spring Boot domains to modern TypeScript architectures.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Paste Your Java Code",
    description:
      "Drop any JPA @Entity class into the converter. The parser understands annotations, types, and constraints.",
  },
  {
    number: "02",
    title: "AST Analysis & Mapping",
    description:
      "JavaParser builds an AST, extracts field metadata, and deterministic rules map Java types to TypeScript equivalents.",
  },
  {
    number: "03",
    title: "Get Production-Ready Output",
    description:
      "Receive validated Zod schemas with proper nullability and Prisma models with correct decorators. Copy and ship.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <GridBackground />
        <Particles count={40} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-sm mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            POC Live — Java to TypeScript Engine
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] animate-fade-in-up">
            <span className="text-white">From Legacy Java</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
              to Modern TypeScript
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            Transmuter.ai converts Spring Boot JPA entities into{" "}
            <span className="text-gray-200">Zod schemas</span> and{" "}
            <span className="text-gray-200">Prisma models</span> using
            deterministic AST analysis — not prompt guessing.
          </p>

          {/* CTA Buttons */}
          <div
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            <Link
              href="/converter"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-base transition-all hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:scale-[1.02]"
            >
              Try the Converter
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 text-gray-300 font-medium text-base hover:bg-white/5 hover:border-white/20 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              View Source Code
            </a>
          </div>

          {/* Scroll indicator */}
          <div
            className="absolute mt-24 left-1/2 -translate-x-1/2 animate-fade-in"
            style={{ animationDelay: "1s", opacity: 0 }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/10 flex justify-center pt-2 animate-float">
              <div className="w-1 h-2 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM / SOLUTION ─── */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Problem */}
            <div>
              <div className="text-xs font-semibold tracking-widest text-red-400/80 uppercase mb-4">
                The Problem
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Manual migration is slow, error-prone, and expensive
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Teams spend months rewriting Spring Boot entities by hand. Every
                field mapping is a chance for bugs. Nullable constraints get
                lost. Type conversions diverge. And the result still needs to be
                validated.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Hundreds of entity classes to convert manually",
                  "Type mismatches between Java and TypeScript",
                  "Lost constraints and annotation semantics",
                  "No validation that output matches input structure",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-400/60 mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div>
              <div className="text-xs font-semibold tracking-widest text-emerald-400/80 uppercase mb-4">
                The Solution
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Deterministic AST conversion you can trust
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Transmuter.ai parses Java source code into an Abstract Syntax
                Tree, extracts JPA metadata, and applies verified mapping rules
                to produce correct TypeScript output. Every time.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Automated parsing of @Entity, @Column, @Id annotations",
                  "Deterministic type mapping — Long to BigInt, String to String",
                  "Nullable constraints preserved in both Zod and Prisma",
                  "Auditable pipeline: input AST → rules → output",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-emerald-400/60 mt-0.5 shrink-0"
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
                    <span className="text-gray-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE DEMO ─── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-widest text-violet-400/80 uppercase mb-4">
              See It In Action
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              One entity, two outputs
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Paste a Java JPA entity and get both a Zod schema and Prisma model
              instantly. Here&apos;s what the pipeline produces:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:row-span-2">
              <CodeBlock
                code={JAVA_INPUT}
                language="java"
                label="Input — Java Entity"
                accentColor="text-orange-400"
              />
            </div>
            <div className="lg:col-span-2">
              <CodeBlock
                code={ZOD_OUTPUT}
                language="typescript"
                label="Output — Zod Schema"
                accentColor="text-emerald-400"
              />
            </div>
            <div className="lg:col-span-2">
              <CodeBlock
                code={PRISMA_OUTPUT}
                language="prisma"
                label="Output — Prisma Model"
                accentColor="text-purple-400"
              />
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="hidden lg:flex items-center justify-center mt-8">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-700" />
              Deterministic mapping — no LLM involved
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-700" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-xs font-semibold tracking-widest text-blue-400/80 uppercase mb-4">
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Three steps to modern TypeScript
            </h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-6 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-purple-500/30" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {STEPS.map((step, i) => (
                <div key={step.number} className="relative text-center">
                  {/* Step number */}
                  <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-gray-950 mb-6">
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="text-xs font-semibold tracking-widest text-cyan-400/80 uppercase mb-4">
              Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Built for real migrations
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Not a toy translator. An architecture-aware engine that
              understands JPA semantics and produces production-ready output.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-white/[0.06] flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ARCHITECTURE DIAGRAM ─── */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold tracking-widest text-amber-400/80 uppercase mb-4">
              Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              The conversion pipeline
            </h2>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {[
                {
                  label: "Java Source",
                  sub: "@Entity class",
                  color: "from-orange-500/20 to-orange-600/10",
                  border: "border-orange-500/20",
                  text: "text-orange-400",
                },
                {
                  label: "AST Parser",
                  sub: "JavaParser",
                  color: "from-blue-500/20 to-blue-600/10",
                  border: "border-blue-500/20",
                  text: "text-blue-400",
                },
                {
                  label: "Core Engine",
                  sub: "Type Mapping",
                  color: "from-violet-500/20 to-violet-600/10",
                  border: "border-violet-500/20",
                  text: "text-violet-400",
                },
                {
                  label: "Output",
                  sub: "Zod + Prisma",
                  color: "from-emerald-500/20 to-emerald-600/10",
                  border: "border-emerald-500/20",
                  text: "text-emerald-400",
                },
              ].map((step, i, arr) => (
                <div
                  key={step.label}
                  className="flex items-center gap-4 sm:gap-6"
                >
                  <div
                    className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-b ${step.color} border ${step.border}`}
                  >
                    <span className={`text-sm font-semibold ${step.text}`}>
                      {step.label}
                    </span>
                    <span className="text-xs text-gray-500">{step.sub}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <svg
                      className="w-5 h-5 text-gray-600 shrink-0 hidden sm:block"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-violet-600/5 blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Start converting
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              right now
            </span>
          </h2>
          <p className="mt-6 text-gray-400 text-lg max-w-xl mx-auto">
            Paste your first @Entity class and see the magic of deterministic
            AST-based migration. No signup, no API keys, no waiting.
          </p>
          <div className="mt-10">
            <Link
              href="/converter"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-lg transition-all hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:scale-[1.02]"
            >
              Open the Converter
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Transmuter.ai
            </span>
            <span className="text-gray-600 text-xs">
              Legacy-to-Modern Migration Engine
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
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
