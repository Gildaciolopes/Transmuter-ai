import type { ParseResult } from "./types";
import { javaToTs } from "./type-map";

/**
 * Generate a NestJS @Injectable() stub from a Spring @Component class.
 * Produces compilable stubs for all public methods with TODO comments.
 */
export function generateComponent(cls: ParseResult): string {
  const lines: string[] = [];
  const methods = cls.methods ?? [];

  lines.push(`// AUTO-MIGRATED: review method implementations`);
  lines.push(`import { Injectable } from '@nestjs/common';`);
  lines.push("");
  lines.push(`@Injectable()`);
  lines.push(`export class ${cls.className} {`);

  if (methods.length === 0) {
    lines.push(`  // TODO: migrate from ${cls.packageName}.${cls.className}`);
  } else {
    for (let i = 0; i < methods.length; i++) {
      const m = methods[i];
      const params = (m.params ?? [])
        .map((p) => `${p.name}: ${mapReturnType(p.type)}`)
        .join(", ");
      const returnType = mapReturnType(m.returnType);

      lines.push(`  // TODO: migrate from ${cls.packageName}.${cls.className}`);
      lines.push(`  ${m.name}(${params}): ${returnType} {`);
      lines.push(`    throw new Error('TODO: implement');`);
      lines.push(`  }`);
      if (i < methods.length - 1) lines.push("");
    }
  }

  lines.push("}");
  return lines.join("\n");
}

function mapReturnType(javaType: string): string {
  if (javaType === "void") return "void";
  if (
    javaType.startsWith("List<") ||
    javaType.startsWith("Set<") ||
    javaType.startsWith("Collection<")
  ) {
    const inner = javaType.substring(
      javaType.indexOf("<") + 1,
      javaType.lastIndexOf(">"),
    );
    return `${javaToTs[inner] ?? inner}[]`;
  }
  if (javaType.startsWith("Optional<")) {
    const inner = javaType.substring(9, javaType.length - 1);
    return `${javaToTs[inner] ?? inner} | undefined`;
  }
  return javaToTs[javaType] ?? javaType;
}

/**
 * Generate a NestJS @Module() stub from a Spring @Configuration class.
 */
export function generateConfiguration(cls: ParseResult): string {
  const moduleName =
    cls.className.replace(/Config(?:uration)?$/, "") + "Module";
  const lines: string[] = [];

  lines.push(`// AUTO-MIGRATED: review configuration`);
  lines.push(`import { Module } from '@nestjs/common';`);
  lines.push("");
  lines.push(`@Module({`);
  lines.push(`  imports: [],`);
  lines.push(`  providers: [],`);
  lines.push(`  exports: [],`);
  lines.push(`})`);
  lines.push(`export class ${moduleName} {`);
  lines.push(
    `  // TODO: migrate configuration from ${cls.packageName}.${cls.className}`,
  );
  lines.push("}");

  return lines.join("\n");
}
