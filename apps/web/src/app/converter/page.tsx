"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Braces,
  Database,
  FileCode2,
  Sparkles,
  ChevronRight,
  Columns2,
  Layers,
  Zap,
  Code2,
} from "lucide-react";

const SAMPLE_JAVA = `@Entity
public class User {
  @Id
  @GeneratedValue
  private Long id;

  @Column(nullable = false)
  private String email;

  private Integer age;
}`;

interface ConvertResultItem {
  className: string;
  zod: string;
  prisma: string;
}

type OutputTab = "zod" | "prisma";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function OutputPanel({
  result,
  index,
}: {
  result: ConvertResultItem;
  index: number;
}) {
  const [activeTab, setActiveTab] = useState<OutputTab>("zod");

  const tabs: {
    key: OutputTab;
    label: string;
    icon: React.ReactNode;
    color: string;
    activeColor: string;
  }[] = [
    {
      key: "zod",
      label: "Zod Schema",
      icon: <Braces className="w-3.5 h-3.5" />,
      color: "text-gray-500",
      activeColor: "text-emerald-400",
    },
    {
      key: "prisma",
      label: "Prisma Model",
      icon: <Database className="w-3.5 h-3.5" />,
      color: "text-gray-500",
      activeColor: "text-purple-400",
    },
  ];

  const code = activeTab === "zod" ? result.zod : result.prisma;
  const accentGradient =
    activeTab === "zod"
      ? "from-emerald-500/20 to-emerald-600/5"
      : "from-purple-500/20 to-purple-600/5";
  const borderAccent =
    activeTab === "zod" ? "border-emerald-500/20" : "border-purple-500/20";

  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all relative ${
                activeTab === tab.key
                  ? tab.activeColor
                  : "text-gray-500 hover:text-gray-400"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-px ${
                    activeTab === "zod" ? "bg-emerald-400" : "bg-purple-400"
                  }`}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pr-2">
          <span className="text-[10px] font-mono text-gray-600 bg-white/[0.03] px-2 py-0.5 rounded">
            {result.className}
          </span>
          <CopyButton text={code} />
        </div>
      </div>

      {/* Code content */}
      <div className={`relative bg-gradient-to-br ${accentGradient}`}>
        <div className={`absolute top-0 left-0 w-full h-px ${borderAccent}`} />
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed max-h-72">
          <code className="text-gray-300 font-mono">{code}</code>
        </pre>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01]">
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-2xl bg-violet-500/10 rounded-full" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-white/[0.06] flex items-center justify-center">
          <Columns2 className="w-7 h-7 text-violet-400/60" />
        </div>
      </div>
      <p className="text-gray-500 text-sm font-medium mb-1">
        Output will appear here
      </p>
      <p className="text-gray-600 text-xs">
        Paste Java code and hit Convert to see results
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
            <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="p-4 space-y-2.5">
            {[...Array(4)].map((_, j) => (
              <div
                key={j}
                className="h-3 rounded bg-white/[0.04] animate-pulse"
                style={{
                  width: `${65 + Math.random() * 30}%`,
                  animationDelay: `${j * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsBar({ results }: { results: ConvertResultItem[] }) {
  if (results.length === 0) return null;

  const totalFields = results.reduce((acc, r) => {
    const zodFields = (r.zod.match(/z\.\w+/g) || []).length;
    return acc + zodFields;
  }, 0);

  const stats = [
    {
      icon: <Layers className="w-3.5 h-3.5" />,
      label: "Entities",
      value: results.length,
      color: "text-blue-400",
    },
    {
      icon: <Zap className="w-3.5 h-3.5" />,
      label: "Fields mapped",
      value: totalFields,
      color: "text-amber-400",
    },
    {
      icon: <Code2 className="w-3.5 h-3.5" />,
      label: "Outputs",
      value: results.length * 2,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="flex items-center gap-4 px-1 mb-4 animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="font-medium">Conversion complete</span>
      </div>
      <div className="h-3 w-px bg-white/10" />
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-1.5 text-xs text-gray-500"
        >
          <span className={stat.color}>{stat.icon}</span>
          <span>
            <span className="text-gray-400 font-medium">{stat.value}</span>{" "}
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ConverterPage() {
  const [code, setCode] = useState(SAMPLE_JAVA);
  const [results, setResults] = useState<ConvertResultItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  const handleConvert = useCallback(async () => {
    if (loading || !code.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`${apiUrl}/convert/simple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Conversion failed");
        return;
      }

      setResults(data.results ?? []);
    } catch (err) {
      setError(`Failed to connect to API: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [code, loading, apiUrl]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleConvert();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleConvert]);

  const lineCount = code.split("\n").length;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-blue-600/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/[0.04] bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Transmuter.ai
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-sm text-gray-400">Converter</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-gray-600">POST</span>
              <span className="text-[10px] font-mono text-gray-500">
                /convert/simple
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-gray-500 hidden sm:inline">
                Engine ready
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-6 py-6">
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs">
              <Sparkles className="w-3 h-3" />
              AST-Powered Conversion
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Java Entity{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Converter
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Paste your JPA @Entity classes and get production-ready Zod schemas
            and Prisma models instantly.
          </p>
        </div>

        {/* Editor grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="flex flex-col">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm overflow-hidden flex flex-col flex-1">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                    <FileCode2 className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-xs text-gray-400 font-medium">
                      Entity.java
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
                  <span>{lineCount} lines</span>
                  <span className="text-gray-700">|</span>
                  <span>Java</span>
                </div>
              </div>

              {/* Textarea with line-number gutter feel */}
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  className="w-full h-full min-h-[380px] bg-transparent p-4 pl-5 font-mono text-[13px] leading-relaxed text-gray-300 focus:outline-none resize-none placeholder-gray-700"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your Java @Entity class here..."
                  spellCheck={false}
                />
              </div>

              {/* Bottom action bar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600">
                    Supports @Entity, @Column, @Id, @GeneratedValue
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-[10px] text-gray-600 font-mono">
                    {navigator?.platform?.includes("Mac") ? "⌘" : "Ctrl"}+Enter
                  </span>
                  <button
                    onClick={handleConvert}
                    disabled={loading || !code.trim()}
                    className="group flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Convert
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Output panel */}
          <div className="flex flex-col">
            {/* Stats bar */}
            <StatsBar results={results} />

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 p-4 mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] backdrop-blur-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-medium">
                    Conversion failed
                  </p>
                  <p className="text-xs text-red-400/70 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {loading ? (
              <LoadingSkeleton />
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, i) => (
                  <OutputPanel
                    key={result.className}
                    result={result}
                    index={i}
                  />
                ))}
              </div>
            ) : !error ? (
              <EmptyState />
            ) : null}
          </div>
        </div>

        {/* Mapping reference */}
        <div className="mt-8 rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400/60" />
            <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Type Mapping Reference
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { java: "Long", prisma: "BigInt", ts: "number" },
              { java: "Integer", prisma: "Int", ts: "number" },
              { java: "String", prisma: "String", ts: "string" },
              { java: "Boolean", prisma: "Boolean", ts: "boolean" },
              { java: "Double", prisma: "Float", ts: "number" },
              { java: "Date", prisma: "DateTime", ts: "Date" },
            ].map((mapping) => (
              <div
                key={mapping.java}
                className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="text-[10px] text-orange-400/70 font-mono">
                  {mapping.java}
                </span>
                <div className="flex items-center gap-1">
                  <ChevronRight className="w-2.5 h-2.5 text-gray-700" />
                  <span className="text-[10px] text-purple-400/70 font-mono">
                    {mapping.prisma}
                  </span>
                  <span className="text-gray-700 text-[10px]">/</span>
                  <span className="text-[10px] text-emerald-400/70 font-mono">
                    {mapping.ts}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-6 px-6 mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Transmuter.ai
            </span>
            <span className="text-gray-600 text-xs">
              Legacy-to-Modern Migration Engine
            </span>
          </div>
          <div className="flex items-center gap-6 text-gray-500 text-sm">
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Home
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
