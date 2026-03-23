import { ParseResult } from "./types";
import { javaToZod } from "./type-map";

export function generateZodSchema(entity: ParseResult): string {
  const lines: string[] = [];
  lines.push('import { z } from "zod";');
  lines.push("");
  lines.push(`export const ${entity.className}Schema = z.object({`);

  for (const field of entity.fields) {
    const zodType = javaToZod[field.type] ?? "z.unknown()";
    const isOptional = field.nullable;
    const suffix = isOptional ? ".optional()" : "";
    lines.push(`  ${field.name}: ${zodType}${suffix},`);
  }

  lines.push("});");
  lines.push("");
  lines.push(
    `export type ${entity.className} = z.infer<typeof ${entity.className}Schema>;`,
  );

  return lines.join("\n");
}
