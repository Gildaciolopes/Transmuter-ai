"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import JSZip from "jszip";
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
  Zap,
  Code2,
  Server,
  Box,
  Hash,
  AlertTriangle,
  FolderOpen,
  GitBranch,
  Download,
  Upload,
  FileArchive,
  X,
} from "lucide-react";

// ─────────── Samples ───────────

const SAMPLES = {
  fullStack: {
    label: "Full Stack",
    hint: "Entity · Service · Controller · DTO · Enum",
    code: `package com.example.shop.product;

import javax.persistence.*;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Entity
public class Product {
  @Id
  @GeneratedValue
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private Double price;

  private String description;

  @Enumerated
  private ProductStatus status;
}

public enum ProductStatus {
  AVAILABLE, OUT_OF_STOCK, DISCONTINUED
}

public class CreateProductDto {
  private String name;
  private Double price;
  private String description;
}

@Service
public class ProductService {
  public Product findById(Long id) { return null; }
  public List<Product> findAll() { return null; }
}

@RestController
@RequestMapping("/products")
public class ProductController {
  @GetMapping
  public List<Product> findAll() { return null; }

  @GetMapping("/{id}")
  public Product findById(@PathVariable Long id) { return null; }

  @PostMapping
  public Product create(@RequestBody CreateProductDto dto) { return null; }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {}
}`,
  },
  relations: {
    label: "JPA Relations",
    hint: "@OneToMany · @ManyToOne between entities",
    code: `package com.example.order;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class Customer {
  @Id
  @GeneratedValue
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String email;

  @OneToMany(mappedBy = "customer")
  private List<Order> orders;
}

@Entity
public class Order {
  @Id
  @GeneratedValue
  private Long id;

  @ManyToOne
  private Customer customer;

  @Column(nullable = false)
  private Double total;

  private LocalDateTime createdAt;

  @Enumerated
  private OrderStatus status;
}

public enum OrderStatus {
  PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
}`,
  },
  entity: {
    label: "Entity Only",
    hint: "Single @Entity with field mapping",
    code: `@Entity
public class User {
  @Id
  @GeneratedValue
  private Long id;

  @Column(nullable = false)
  private String email;

  private Integer age;

  private Boolean active;

  private java.util.UUID externalId;
}`,
  },
} as const;

type SampleKey = keyof typeof SAMPLES;

// ─────────── API types ───────────

type FileType =
  | "zod"
  | "nestjs-service"
  | "nestjs-controller"
  | "nestjs-module"
  | "dto"
  | "enum"
  | "prisma-schema";

interface GeneratedFile {
  path: string;
  content: string;
  type: FileType;
}

interface ProjectResult {
  prismaSchema: string;
  files: GeneratedFile[];
  report: {
    totalClasses: number;
    converted: number;
    flagged: number;
    skipped: number;
    flaggedItems: Array<{ className: string; reason: string }>;
  };
}

type OutputCategory = "prisma" | "zod" | "nestjs" | "dto" | "enum";

// ─────────── Category config ───────────

interface CategoryConfig {
  label: string;
  color: string;
  activeBg: string;
  activeBorder: string;
  fileTypes: FileType[];
  icon: React.ReactNode;
}

const CATEGORIES: Record<OutputCategory, CategoryConfig> = {
  prisma: {
    label: "Prisma",
    color: "text-purple-400",
    activeBg: "bg-purple-500/10",
    activeBorder: "border-purple-500/30",
    fileTypes: ["prisma-schema"],
    icon: <Database className="w-3.5 h-3.5" />,
  },
  zod: {
    label: "Zod",
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/10",
    activeBorder: "border-emerald-500/30",
    fileTypes: ["zod"],
    icon: <Braces className="w-3.5 h-3.5" />,
  },
  nestjs: {
    label: "NestJS",
    color: "text-blue-400",
    activeBg: "bg-blue-500/10",
    activeBorder: "border-blue-500/30",
    fileTypes: ["nestjs-service", "nestjs-controller", "nestjs-module"],
    icon: <Server className="w-3.5 h-3.5" />,
  },
  dto: {
    label: "DTO",
    color: "text-amber-400",
    activeBg: "bg-amber-500/10",
    activeBorder: "border-amber-500/30",
    fileTypes: ["dto"],
    icon: <Box className="w-3.5 h-3.5" />,
  },
  enum: {
    label: "Enum",
    color: "text-pink-400",
    activeBg: "bg-pink-500/10",
    activeBorder: "border-pink-500/30",
    fileTypes: ["enum"],
    icon: <Hash className="w-3.5 h-3.5" />,
  },
};

function fileTypeBadgeColor(type: FileType): string {
  if (type.startsWith("nestjs")) return "text-blue-400/70 bg-blue-500/10";
  if (type === "zod") return "text-emerald-400/70 bg-emerald-500/10";
  if (type === "dto") return "text-amber-400/70 bg-amber-500/10";
  if (type === "enum") return "text-pink-400/70 bg-pink-500/10";
  if (type === "prisma-schema") return "text-purple-400/70 bg-purple-500/10";
  return "text-gray-500 bg-white/[0.04]";
}

function fileTypeBadgeLabel(type: FileType): string {
  const labels: Record<FileType, string> = {
    zod: "Zod",
    "nestjs-service": "Service",
    "nestjs-controller": "Controller",
    "nestjs-module": "Module",
    dto: "DTO",
    enum: "Enum",
    "prisma-schema": "Prisma",
  };
  return labels[type] ?? type;
}

// ─────────── Sub-components ───────────

function CopyButton({
  text,
  size = "sm",
}: {
  text: string;
  size?: "xs" | "sm";
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cls =
    size === "xs"
      ? "text-[10px] px-2 py-0.5 gap-1"
      : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      className={`flex items-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/[0.05] transition-all ${cls}`}
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

function FileCard({
  file,
  defaultOpen = false,
}: {
  file: GeneratedFile;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const parts = file.path.split("/");
  const filename = parts.pop() ?? file.path;
  const dir = parts.length > 0 ? parts.join("/") + "/" : "";

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden transition-all">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="w-3.5 h-3.5 text-gray-700 shrink-0" />
          {dir && (
            <span className="text-[11px] font-mono text-gray-600 truncate max-w-[140px]">
              {dir}
            </span>
          )}
          <span className="text-[12px] font-mono text-gray-300 shrink-0 font-medium">
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${fileTypeBadgeColor(file.type)}`}
          >
            {fileTypeBadgeLabel(file.type)}
          </span>
          <CopyButton text={file.content} size="xs" />
          <ChevronRight
            className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-150 ${
              open ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.04] bg-black/20">
          <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed max-h-96">
            <code className="text-gray-300 font-mono whitespace-pre">
              {file.content}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[340px] rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01]">
      <div className="relative mb-5">
        <div className="absolute inset-0 blur-2xl bg-violet-500/10 rounded-full" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-white/[0.06] flex items-center justify-center">
          <Columns2 className="w-7 h-7 text-violet-400/60" />
        </div>
      </div>
      <p className="text-gray-500 text-sm font-medium mb-1">
        Output will appear here
      </p>
      <p className="text-gray-600 text-xs mb-5">
        Paste Java code and hit Convert
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 px-8 max-w-xs">
        {[
          {
            label: "@Entity",
            color: "text-purple-400/60 border-purple-500/10 bg-purple-500/5",
          },
          {
            label: "@Service",
            color: "text-blue-400/60 border-blue-500/10 bg-blue-500/5",
          },
          {
            label: "@RestController",
            color: "text-blue-300/60 border-blue-400/10 bg-blue-400/5",
          },
          {
            label: "enum",
            color: "text-pink-400/60 border-pink-500/10 bg-pink-500/5",
          },
          {
            label: "Dto",
            color: "text-amber-400/60 border-amber-500/10 bg-amber-500/5",
          },
          {
            label: "@OneToMany",
            color: "text-violet-400/60 border-violet-500/10 bg-violet-500/5",
          },
        ].map(({ label, color }) => (
          <span
            key={label}
            className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${color}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {/* Tab skeleton */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-8 rounded-md bg-white/[0.04] animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      {/* File cards skeleton */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-3 w-4 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-48 rounded bg-white/[0.05] animate-pulse" />
            <div className="ml-auto h-4 w-12 rounded bg-white/[0.04] animate-pulse" />
          </div>
          {i === 0 && (
            <div className="border-t border-white/[0.04] p-4 space-y-2">
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  className="h-2.5 rounded bg-white/[0.03] animate-pulse"
                  style={{
                    width: `${55 + j * 10}%`,
                    animationDelay: `${j * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────── Output section ───────────

async function downloadZip(result: ProjectResult) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // All TS/Prisma files
  for (const file of result.files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transmuter-output.zip";
  a.click();
  URL.revokeObjectURL(url);
}

function StatsRow({ result }: { result: ProjectResult }) {
  const counts = {
    entities: result.files.filter((f) => f.type === "zod").length,
    services: result.files.filter((f) => f.type === "nestjs-service").length,
    controllers: result.files.filter((f) => f.type === "nestjs-controller")
      .length,
    dtos: result.files.filter((f) => f.type === "dto").length,
    enums: result.files.filter((f) => f.type === "enum").length,
  };

  const activeStats = [
    { key: "entities", color: "text-purple-400", label: "entities" },
    { key: "services", color: "text-blue-400", label: "services" },
    { key: "controllers", color: "text-blue-300", label: "controllers" },
    { key: "dtos", color: "text-amber-400", label: "DTOs" },
    { key: "enums", color: "text-pink-400", label: "enums" },
  ].filter((s) => counts[s.key as keyof typeof counts] > 0);

  const totalFiles =
    result.files.filter((f) => f.type !== "prisma-schema").length + 1;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0.5 mb-3">
      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="font-semibold">Converted</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      {activeStats.map((s) => (
        <span key={s.key} className={`text-xs font-mono ${s.color}`}>
          {counts[s.key as keyof typeof counts]}{" "}
          <span className="text-gray-500">{s.label}</span>
        </span>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
          <Code2 className="w-3 h-3" />
          {totalFiles} files
        </span>
        <button
          onClick={() => downloadZip(result)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all"
        >
          <Download className="w-3 h-3" />
          Download .zip
        </button>
      </div>
    </div>
  );
}

function OutputSection({ result }: { result: ProjectResult }) {
  const allCategories = Object.keys(CATEGORIES) as OutputCategory[];

  const availableCategories = allCategories.filter((cat) => {
    if (cat === "prisma") return !!result.prismaSchema;
    return result.files.some((f) => CATEGORIES[cat].fileTypes.includes(f.type));
  });

  const [activeCategory, setActiveCategory] = useState<OutputCategory>(
    availableCategories[0] ?? "prisma",
  );

  useEffect(() => {
    if (availableCategories.length > 0) {
      setActiveCategory(availableCategories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const activeFiles =
    activeCategory === "prisma"
      ? []
      : result.files.filter((f) =>
          CATEGORIES[activeCategory].fileTypes.includes(f.type),
        );

  return (
    <div className="flex flex-col gap-3">
      <StatsRow result={result} />

      {/* Category tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        {availableCategories.map((cat) => {
          const cfg = CATEGORIES[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? `${cfg.color} ${cfg.activeBg} border ${cfg.activeBorder} shadow-sm`
                  : "text-gray-600 hover:text-gray-400 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              {cfg.icon}
              <span className="hidden sm:inline">{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-2.5">
        {activeCategory === "prisma" ? (
          <div className="rounded-xl border border-purple-500/10 bg-white/[0.015] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-purple-300">
                  schema.prisma
                </span>
              </div>
              <CopyButton text={result.prismaSchema} />
            </div>
            <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed max-h-[520px]">
              <code className="text-gray-300 font-mono whitespace-pre">
                {result.prismaSchema}
              </code>
            </pre>
          </div>
        ) : (
          activeFiles.map((file, i) => (
            <FileCard key={file.path} file={file} defaultOpen={i === 0} />
          ))
        )}

        {activeCategory !== "prisma" && activeFiles.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm">
            No {CATEGORIES[activeCategory].label} files generated
          </div>
        )}
      </div>

      {/* Flagged items */}
      {result.report.flaggedItems.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {result.report.flaggedItems.length} item
            {result.report.flaggedItems.length > 1 ? "s" : ""} need manual
            review
          </div>
          {result.report.flaggedItems.map((item) => (
            <div key={item.className} className="pl-5 text-[11px]">
              <span className="font-mono text-amber-400/80">
                {item.className}
              </span>
              <span className="text-gray-600"> — </span>
              <span className="text-amber-500/70">{item.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────── Main page ───────────

type InputMode = "code" | "zip";

export default function ConverterPage() {
  const [code, setCode] = useState<string>(SAMPLES.fullStack.code);
  const [activeSample, setActiveSample] = useState<SampleKey>("fullStack");
  const [result, setResult] = useState<ProjectResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("code");
  const [zipFiles, setZipFiles] = useState<{ path: string; content: string }[]>(
    [],
  );
  const [zipFileName, setZipFileName] = useState("");
  const [zipError, setZipError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  async function processZipFile(file: File) {
    setZipError("");
    if (!file.name.endsWith(".zip")) {
      setZipError("Please upload a .zip file.");
      return;
    }
    try {
      const zip = await JSZip.loadAsync(file);
      const extracted: { path: string; content: string }[] = [];
      const promises: Promise<void>[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && relativePath.endsWith(".java")) {
          promises.push(
            zipEntry.async("string").then((content) => {
              extracted.push({ path: relativePath, content });
            }),
          );
        }
      });
      await Promise.all(promises);
      extracted.sort((a, b) => a.path.localeCompare(b.path));
      if (extracted.length === 0) {
        setZipError("No .java files found in the ZIP.");
        return;
      }
      setZipFiles(extracted);
      setZipFileName(file.name);
      setResult(null);
      setError("");
    } catch {
      setZipError("Failed to read ZIP file. Make sure it is a valid archive.");
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processZipFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processZipFile(file);
  }

  function clearZip() {
    setZipFiles([]);
    setZipFileName("");
    setZipError("");
    setResult(null);
    setError("");
  }

  const handleConvert = useCallback(async () => {
    if (loading) return;
    if (inputMode === "code" && !code.trim()) return;
    if (inputMode === "zip" && zipFiles.length === 0) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const files =
        inputMode === "zip"
          ? zipFiles
          : [{ path: "Input.java", content: code }];

      const res = await fetch(`${apiUrl}/convert/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Conversion failed");
        return;
      }

      setResult(data as ProjectResult);
    } catch (err) {
      setError(`Failed to connect to API: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [code, inputMode, zipFiles, loading, apiUrl]);

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

  function handleSampleSelect(key: SampleKey) {
    setActiveSample(key);
    setCode(SAMPLES[key].code);
    setResult(null);
    setError("");
  }

  const canConvert =
    inputMode === "code" ? code.trim().length > 0 : zipFiles.length > 0;

  const lineCount = code.split("\n").length;

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-950">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[700px] h-[400px] rounded-full bg-blue-600/[0.04] blur-[130px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[130px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-indigo-600/[0.03] blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/[0.04] bg-gray-950/80 backdrop-blur-xl top-0">
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
              <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
              <span className="text-sm text-gray-400">Converter</span>
            </div>
          </div>

          <div className="flex items-center gap-3"></div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/[0.07] text-violet-400 text-xs font-medium">
              <GitBranch className="w-3 h-3" />
              AST-Powered · Multi-Stereotype
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Java{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              → TypeScript
            </span>{" "}
            Converter
          </h1>
        </div>

        {/* Editor grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ─── Input panel ─── */}
          <div className="flex flex-col top-20">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.012] backdrop-blur-sm overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  {/* Mode toggle */}
                  <div className="flex items-center gap-1 p-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                    <button
                      onClick={() => setInputMode("code")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        inputMode === "code"
                          ? "bg-white/[0.08] text-gray-200"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      <FileCode2 className="w-3 h-3 text-orange-400" />
                      Code
                    </button>
                    <button
                      onClick={() => setInputMode("zip")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        inputMode === "zip"
                          ? "bg-white/[0.08] text-gray-200"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      <FileArchive className="w-3 h-3 text-violet-400" />
                      ZIP Project
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
                  {inputMode === "code" ? (
                    <>
                      <span>{lineCount} lines</span>
                      <span className="text-gray-700">|</span>
                      <span>Java</span>
                    </>
                  ) : zipFiles.length > 0 ? (
                    <span className="text-violet-400/80">
                      {zipFiles.length} .java files
                    </span>
                  ) : (
                    <span>ZIP</span>
                  )}
                </div>
              </div>

              {/* Sample picker — only in code mode */}
              {inputMode === "code" && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01] flex-wrap">
                  <span className="text-[10px] text-gray-700 font-semibold uppercase tracking-widest shrink-0">
                    Try:
                  </span>
                  {(Object.keys(SAMPLES) as SampleKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSampleSelect(key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                        activeSample === key
                          ? "bg-violet-500/10 border-violet-500/25 text-violet-300"
                          : "text-gray-500 hover:text-gray-400 hover:bg-white/[0.03] border-transparent"
                      }`}
                    >
                      {SAMPLES[key].label}
                      {activeSample === key && (
                        <span className="text-[9px] text-violet-500/60 hidden sm:inline truncate max-w-[120px]">
                          {SAMPLES[key].hint}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea — code mode */}
              {inputMode === "code" && (
                <textarea
                  className="w-full min-h-[400px] bg-transparent p-5 font-mono text-[13px] leading-relaxed text-gray-300 focus:outline-none resize-none placeholder-gray-700 tab-size-2"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste Java code here...&#10;&#10;Supports: @Entity · @Service · @RestController · @Repository · Dto · enum&#10;Multiple classes in the same paste are supported."
                  spellCheck={false}
                />
              )}

              {/* ZIP upload — zip mode */}
              {inputMode === "zip" && (
                <div className="p-5 flex flex-col gap-3 min-h-[400px]">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  {zipFiles.length === 0 ? (
                    /* Drop zone */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[320px] ${
                        isDragging
                          ? "border-violet-500/50 bg-violet-500/[0.05]"
                          : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3 pointer-events-none">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-300 font-medium">
                            Drop your ZIP here
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            or click to browse
                          </p>
                        </div>
                        <p className="text-[11px] text-gray-700 text-center max-w-[240px]">
                          All <span className="font-mono">.java</span> files
                          inside the archive will be extracted and converted
                        </p>
                      </div>
                      {zipError && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/[0.05] pointer-events-none">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="text-xs text-red-400">
                            {zipError}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* File list */
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileArchive className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-medium text-gray-300 truncate max-w-[200px]">
                            {zipFileName}
                          </span>
                          <span className="text-[10px] text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded font-medium">
                            {zipFiles.length} files
                          </span>
                        </div>
                        <button
                          onClick={clearZip}
                          className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/[0.05]"
                        >
                          <X className="w-3 h-3" />
                          Clear
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto max-h-[320px] rounded-lg border border-white/[0.05] bg-white/[0.01] divide-y divide-white/[0.04]">
                        {zipFiles.map((f) => {
                          const parts = f.path.split("/");
                          const name = parts.pop() ?? f.path;
                          const dir =
                            parts.length > 0 ? parts.join("/") + "/" : "";
                          return (
                            <div
                              key={f.path}
                              className="flex items-center gap-2 px-3 py-2"
                            >
                              <FileCode2 className="w-3 h-3 text-orange-400/60 shrink-0" />
                              {dir && (
                                <span className="text-[10px] font-mono text-gray-700 truncate">
                                  {dir}
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-gray-300 font-medium">
                                {name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors text-center py-1"
                      >
                        Replace ZIP
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {[
                    "@Entity",
                    "@Service",
                    "@RestController",
                    "enum",
                    "Dto",
                  ].map((t) => (
                    <span
                      key={t}
                      className="text-[9px] font-mono text-gray-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleConvert}
                    disabled={loading || !canConvert}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/[0.09] text-white text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:scale-100"
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

          {/* ─── Output panel ─── */}
          <div className="flex flex-col min-h-[200px]">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-300 font-semibold">
                    Conversion failed
                  </p>
                  <p className="text-xs text-red-400/70 mt-1">{error}</p>
                </div>
              </div>
            )}

            {loading ? (
              <LoadingSkeleton />
            ) : result ? (
              <OutputSection result={result} />
            ) : !error ? (
              <EmptyState />
            ) : null}
          </div>
        </div>

        {/* ─── Reference table ─── */}
        <div className="mt-10 rounded-xl border border-white/[0.04] bg-white/[0.01] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-amber-400/60" />
            <h3 className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
              Supported Conversions
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stereotypes */}
            <div>
              <p className="text-[10px] text-gray-700 font-semibold uppercase tracking-widest mb-3">
                Class stereotypes
              </p>
              <div className="space-y-2">
                {[
                  {
                    ann: "@Entity",
                    out: "Zod schema + Prisma model",
                    color: "text-purple-400",
                  },
                  {
                    ann: "@Service",
                    out: "NestJS @Injectable service",
                    color: "text-blue-400",
                  },
                  {
                    ann: "@RestController",
                    out: "NestJS @Controller",
                    color: "text-blue-300",
                  },
                  {
                    ann: "Dto suffix",
                    out: "TS interface + Zod schema",
                    color: "text-amber-400",
                  },
                  {
                    ann: "enum",
                    out: "TS enum + Prisma enum block",
                    color: "text-pink-400",
                  },
                ].map((item) => (
                  <div key={item.ann} className="flex items-start gap-2">
                    <span
                      className={`text-[11px] font-mono shrink-0 ${item.color}`}
                    >
                      {item.ann}
                    </span>
                    <span className="text-gray-700 text-[10px] shrink-0">
                      →
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {item.out}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* JPA annotations */}
            <div>
              <p className="text-[10px] text-gray-700 font-semibold uppercase tracking-widest mb-3">
                JPA annotations
              </p>
              <div className="space-y-2">
                {[
                  "@Id + @GeneratedValue",
                  "@Column(nullable = false)",
                  "@OneToMany(mappedBy)",
                  "@ManyToOne → FK field",
                  "@ManyToMany → join table",
                  "@Transient → skipped",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-500/40 shrink-0" />
                    <span className="text-[11px] font-mono text-gray-500">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Type mapping */}
            <div className="sm:col-span-2">
              <p className="text-[10px] text-gray-700 font-semibold uppercase tracking-widest mb-3">
                Type mapping
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { java: "Long", prisma: "BigInt", ts: "number" },
                  { java: "Integer", prisma: "Int", ts: "number" },
                  { java: "String", prisma: "String", ts: "string" },
                  { java: "Boolean", prisma: "Boolean", ts: "boolean" },
                  { java: "Double", prisma: "Float", ts: "number" },
                  { java: "BigDecimal", prisma: "Decimal", ts: "number" },
                  { java: "LocalDate", prisma: "DateTime", ts: "string" },
                  { java: "LocalDateTime", prisma: "DateTime", ts: "string" },
                  { java: "UUID", prisma: "String", ts: "string" },
                ].map((m) => (
                  <div
                    key={m.java}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] min-w-0"
                  >
                    <span className="text-[10px] font-mono text-orange-400/70 shrink-0">
                      {m.java}
                    </span>
                    <ChevronRight className="w-2.5 h-2.5 text-gray-700 shrink-0" />
                    <span className="text-[10px] font-mono text-purple-400/70 shrink-0">
                      {m.prisma}
                    </span>
                    <span className="text-[10px] text-gray-700 shrink-0">
                      /
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/70 shrink-0">
                      {m.ts}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-6 px-6 mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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
