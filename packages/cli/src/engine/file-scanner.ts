import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

export interface JavaFile {
  path: string; // relative to project root
  absolutePath: string;
  content: string;
}

/**
 * Recursively scans a directory for .java files and returns their contents.
 */
export async function scanJavaFiles(sourceDir: string): Promise<JavaFile[]> {
  const absSource = path.resolve(sourceDir);

  if (!fs.existsSync(absSource)) {
    throw new Error(`Source directory not found: ${absSource}`);
  }

  const matches = await glob("**/*.java", {
    cwd: absSource,
    absolute: false,
    nodir: true,
  });

  return matches.map((relativePath) => {
    const absolutePath = path.join(absSource, relativePath);
    const content = fs.readFileSync(absolutePath, "utf-8");
    return { path: relativePath, absolutePath, content };
  });
}
