"use client";

import { useState } from "react";

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

export default function Home() {
  const [code, setCode] = useState(SAMPLE_JAVA);
  const [results, setResults] = useState<ConvertResultItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  async function handleConvert() {
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
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Transmuter.ai
        </h1>
        <p className="text-gray-400 mt-2">
          Java Spring Boot &rarr; TypeScript / Zod / Prisma
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Java Source Code
            <span className="text-gray-500 font-normal ml-2">
              (JPA @Entity classes)
            </span>
          </label>
          <textarea
            className="w-full h-80 bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your Java @Entity class here..."
          />
          <button
            onClick={handleConvert}
            disabled={loading || !code.trim()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? "Converting..." : "Convert"}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {results.map((result) => (
            <div key={result.className} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-400 mb-2">
                  Zod Schema — {result.className}
                </label>
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-auto max-h-60">
                  {result.zod}
                </pre>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-400 mb-2">
                  Prisma Model — {result.className}
                </label>
                <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-100 overflow-auto max-h-60">
                  {result.prisma}
                </pre>
              </div>
            </div>
          ))}

          {!error && results.length === 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center text-gray-500">
              Output will appear here after conversion
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
