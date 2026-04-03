import type { ParseResult, ConstraintInfo } from "./types";
import { javaToZod, javaToTs } from "./type-map";

/**
 * Generates a TypeScript interface + Zod schema for a DTO class.
 */
export function generateDto(dto: ParseResult): string {
  const lines: string[] = [];

  lines.push(`import { z } from 'zod';`);
  lines.push("");

  // TypeScript interface
  lines.push(`export interface ${dto.className} {`);
  for (const field of dto.fields) {
    if (field.isTransient) continue;
    const tsType = javaToTs[field.type] ?? "unknown";
    const optional = field.nullable ? "?" : "";
    lines.push(`  ${field.name}${optional}: ${tsType};`);
  }
  lines.push("}");
  lines.push("");

  // Zod schema with validation constraints
  lines.push(`export const ${dto.className}Schema = z.object({`);
  for (const field of dto.fields) {
    if (field.isTransient) continue;
    let zodType: string;
    if (field.isLob) {
      zodType = "z.string()";
    } else {
      zodType = javaToZod[field.type] ?? "z.unknown()";
      zodType = applyConstraints(zodType, field.constraints ?? {});
    }
    const suffix = field.nullable ? ".optional()" : "";
    lines.push(`  ${field.name}: ${zodType}${suffix},`);
  }
  lines.push("});");
  lines.push("");
  lines.push(
    `export type ${dto.className}Validated = z.infer<typeof ${dto.className}Schema>;`,
  );

  return lines.join("\n");
}

function applyConstraints(
  zodBase: string,
  constraints: ConstraintInfo,
): string {
  let chain = zodBase;

  if (chain.startsWith("z.string()")) {
    if (constraints.email) chain += ".email()";
    if (constraints.notBlank || constraints.notEmpty) chain += ".min(1)";
    if (constraints.sizeMin !== undefined)
      chain += `.min(${constraints.sizeMin})`;
    if (constraints.sizeMax !== undefined)
      chain += `.max(${constraints.sizeMax})`;
    if (
      constraints.columnLength !== undefined &&
      constraints.sizeMax === undefined
    ) {
      chain += `.max(${constraints.columnLength})`;
    }
    if (constraints.pattern) {
      chain += `.regex(new RegExp('${constraints.pattern.replace(/'/g, "\\'")}'))`;
    }
  }

  if (chain.startsWith("z.number()")) {
    if (constraints.positive) chain += ".positive()";
    if (constraints.negative) chain += ".negative()";
    if (constraints.min !== undefined && !constraints.positive)
      chain += `.min(${constraints.min})`;
    if (constraints.max !== undefined) chain += `.max(${constraints.max})`;
  }

  return chain;
}
