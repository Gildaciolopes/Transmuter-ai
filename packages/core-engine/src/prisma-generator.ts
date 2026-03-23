import { ParseResult } from "./types";
import { javaToPrisma } from "./type-map";

export function generatePrismaModel(entity: ParseResult): string {
  const lines: string[] = [];
  lines.push(`model ${entity.className} {`);

  // Calculate padding for alignment
  const maxNameLen = Math.max(...entity.fields.map((f) => f.name.length));
  const maxTypeLen = Math.max(
    ...entity.fields.map((f) => {
      const prismaType = javaToPrisma[f.type] ?? "String";
      const nullable = f.nullable && !f.annotations.includes("Id");
      return prismaType.length + (nullable ? 1 : 0);
    }),
  );

  for (const field of entity.fields) {
    const prismaType = javaToPrisma[field.type] ?? "String";
    const isId = field.annotations.includes("Id");
    const isGenerated = field.annotations.includes("GeneratedValue");
    const nullable = field.nullable && !isId;

    const typeStr = prismaType + (nullable ? "?" : "");
    const namePad = " ".repeat(maxNameLen - field.name.length + 1);
    const typePad = " ".repeat(maxTypeLen - typeStr.length + 1);

    const decorators: string[] = [];
    if (isId) decorators.push("@id");
    if (isGenerated) decorators.push("@default(autoincrement())");

    const decoratorStr =
      decorators.length > 0 ? typePad + decorators.join(" ") : "";
    lines.push(`  ${field.name}${namePad}${typeStr}${decoratorStr}`);
  }

  lines.push("}");

  return lines.join("\n");
}
