import * as fs from "fs";
import * as path from "path";
import type { GeneratedFile } from "@transmuter/core-engine";

/**
 * Write all generated files to the output directory.
 * Creates intermediate directories as needed.
 */
export function writeGeneratedFiles(
  files: GeneratedFile[],
  outputDir: string,
): string[] {
  const writtenPaths: string[] = [];

  for (const file of files) {
    const absPath = path.join(outputDir, file.path);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, file.content, "utf-8");
    writtenPaths.push(absPath);
  }

  return writtenPaths;
}

/**
 * Ensure the output directory exists.
 */
export function ensureOutputDir(outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
}
