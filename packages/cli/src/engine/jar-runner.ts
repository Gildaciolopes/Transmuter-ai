import * as cp from "child_process";
import * as net from "net";
import * as path from "path";
import * as fs from "fs";

const JAR_PATH = path.join(__dirname, "..", "..", "bin", "parser-java.jar");

export interface JarHandle {
  port: number;
  baseUrl: string;
  shutdown: () => void;
}

/**
 * Find a free TCP port.
 */
function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address() as net.AddressInfo;
      srv.close(() => resolve(addr.port));
    });
    srv.on("error", reject);
  });
}

/**
 * Poll the parser's /health endpoint until it responds 200.
 */
async function waitForHealth(url: string, timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Parser service did not start within ${timeoutMs}ms`);
}

/**
 * Check that Java 17+ is available.
 */
export function checkJava(): { ok: boolean; version?: string; error?: string } {
  try {
    const out = cp.execSync("java -version 2>&1", { encoding: "utf-8" });
    const match = out.match(/version "(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      if (major < 17) {
        return {
          ok: false,
          error: `Java ${major} detected — Java 17+ is required`,
        };
      }
      return { ok: true, version: match[0].replace("version ", "") };
    }
    return { ok: true, version: "unknown" };
  } catch {
    return { ok: false, error: "java not found in PATH" };
  }
}

/**
 * Spawn the embedded parser JAR on a free port.
 * Returns a handle with the base URL and a shutdown function.
 */
export async function startJar(): Promise<JarHandle> {
  if (!fs.existsSync(JAR_PATH)) {
    throw new Error(
      `Parser JAR not found at ${JAR_PATH}.\n` +
        "If you are running from source, run: cd packages/parser-java && mvn package -q && " +
        "cp target/parser-java-*.jar packages/cli/bin/parser-java.jar",
    );
  }

  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const proc = cp.spawn("java", ["-jar", JAR_PATH], {
    env: { ...process.env, PARSER_PORT: String(port) },
    stdio: "ignore",
  });

  proc.on("error", (err) => {
    throw new Error(`Failed to start parser JAR: ${err.message}`);
  });

  await waitForHealth(baseUrl);

  return {
    port,
    baseUrl,
    shutdown: () => {
      if (!proc.killed) proc.kill("SIGTERM");
    },
  };
}
