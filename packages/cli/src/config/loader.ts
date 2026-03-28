import * as fs from "fs";
import * as path from "path";
import { TransmuterConfigSchema, type TransmuterConfig } from "./schema";

export const CONFIG_FILENAME = ".transmuter.json";

export function configExists(cwd: string = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, CONFIG_FILENAME));
}

export function loadConfig(cwd: string = process.cwd()): TransmuterConfig {
  const configPath = path.join(cwd, CONFIG_FILENAME);

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `No ${CONFIG_FILENAME} found. Run "transmuter init" to configure your project.`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const result = TransmuterConfigSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid ${CONFIG_FILENAME}:\n${issues}`);
  }

  return result.data;
}

export function saveConfig(
  config: TransmuterConfig,
  cwd: string = process.cwd(),
): void {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}
