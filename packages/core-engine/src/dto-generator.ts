import type { ParseResult } from "./types";
import { javaToZod } from "./type-map";

/**
 * Generates a TypeScript interface + Zod schema for a DTO class.
 *
 * DTOs are treated similarly to entities for Zod generation,
 * but without Prisma output and with TS interface emission.
 */
export function generateDto(dto: ParseResult): string {
  const lines: string[] = [];

  lines.push(`import { z } from 'zod';`);
  lines.push("");

  // TypeScript interface
  lines.push(`export interface ${dto.className} {`);
  for (const field of dto.fields) {
    if (field.isTransient) continue;
    const tsType = javaTypeToTs(field.type);
    const optional = field.nullable ? "?" : "";
    lines.push(`  ${field.name}${optional}: ${tsType};`);
  }
  lines.push("}");
  lines.push("");

  // Zod schema
  lines.push(`export const ${dto.className}Schema = z.object({`);
  for (const field of dto.fields) {
    if (field.isTransient) continue;
    const zodType = javaToZod[field.type] ?? "z.unknown()";
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

function javaTypeToTs(javaType: string): string {
  const map: Record<string, string> = {
    String: "string",
    Long: "number",
    long: "number",
    Integer: "number",
    int: "number",
    Double: "number",
    double: "number",
    Float: "number",
    float: "number",
    Boolean: "boolean",
    boolean: "boolean",
    BigDecimal: "number",
    LocalDate: "string",
    LocalDateTime: "string",
    Date: "Date",
    UUID: "string",
  };
  return map[javaType] ?? "unknown";
}
