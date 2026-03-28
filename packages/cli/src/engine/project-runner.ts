import type {
  ProjectParseResponse,
  GeneratedFile,
  MigrationReport,
} from "@transmuter/core-engine";
import {
  resolveRelations,
  generatePrismaSchema,
  generateZodSchema,
  generateNestService,
  generateNestController,
  generateNestModule,
  generateTsEnum,
  generateDto,
  javaPackageToOutputPath,
} from "@transmuter/core-engine";
import type { JavaFile } from "./file-scanner";

export interface ProjectResult {
  prismaSchema: string;
  files: GeneratedFile[];
  report: MigrationReport;
}

/**
 * Fetches project parse response from the running JAR's /parse/project endpoint.
 */
export async function parseProject(
  baseUrl: string,
  javaFiles: JavaFile[],
): Promise<ProjectParseResponse> {
  const res = await fetch(`${baseUrl}/parse/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: javaFiles.map((f) => ({ path: f.path, content: f.content })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Parser returned ${res.status}: ${text}`);
  }

  return res.json() as Promise<ProjectParseResponse>;
}

/**
 * Run all generators on a parsed project response.
 * Returns all generated files + the migration report.
 */
export function generateProject(response: ProjectParseResponse): ProjectResult {
  const directives = resolveRelations(response);
  const prismaSchema = generatePrismaSchema(response, directives);
  const generatedFiles: GeneratedFile[] = [];
  const flaggedItems: Array<{ className: string; reason: string }> = [];
  let converted = 0;

  for (const cls of response.classes) {
    try {
      switch (cls.stereotype) {
        case "entity": {
          const zodPath = javaPackageToOutputPath(
            cls.packageName,
            cls.className,
            "zod",
          );
          generatedFiles.push({
            path: zodPath,
            content: generateZodSchema(cls),
            type: "zod",
          });
          converted++;
          break;
        }
        case "service": {
          const svcPath = javaPackageToOutputPath(
            cls.packageName,
            cls.className,
            "service",
          );
          const modPath = javaPackageToOutputPath(
            cls.packageName,
            cls.className,
            "module",
          );
          generatedFiles.push({
            path: svcPath,
            content: generateNestService(cls),
            type: "nestjs-service",
          });
          generatedFiles.push({
            path: modPath,
            content: generateNestModule(cls),
            type: "nestjs-module",
          });
          converted++;
          break;
        }
        case "controller": {
          const ctrlPath = javaPackageToOutputPath(
            cls.packageName,
            cls.className,
            "controller",
          );
          generatedFiles.push({
            path: ctrlPath,
            content: generateNestController(cls),
            type: "nestjs-controller",
          });
          converted++;
          break;
        }
        case "dto": {
          const dtoPath = javaPackageToOutputPath(
            cls.packageName,
            cls.className,
            "dto",
          );
          generatedFiles.push({
            path: dtoPath,
            content: generateDto(cls),
            type: "dto",
          });
          converted++;
          break;
        }
        default: {
          flaggedItems.push({
            className: cls.className,
            reason: `Stereotype '${cls.stereotype}' has no generator. Manual migration required.`,
          });
        }
      }
    } catch (err) {
      flaggedItems.push({
        className: cls.className,
        reason: `Generation error: ${(err as Error).message}`,
      });
    }
  }

  for (const enumCls of response.enums) {
    try {
      const enumPath = javaPackageToOutputPath(
        enumCls.packageName,
        enumCls.className,
        "enum",
      );
      generatedFiles.push({
        path: enumPath,
        content: generateTsEnum(enumCls),
        type: "enum",
      });
      converted++;
    } catch (err) {
      flaggedItems.push({
        className: enumCls.className,
        reason: `Enum error: ${(err as Error).message}`,
      });
    }
  }

  generatedFiles.push({
    path: "schema.prisma",
    content: prismaSchema,
    type: "prisma-schema",
  });

  const totalClasses = response.classes.length + response.enums.length;
  const report: MigrationReport = {
    totalClasses,
    converted,
    flagged: flaggedItems.length,
    skipped: totalClasses - converted - flaggedItems.length,
    flaggedItems,
  };

  return { prismaSchema, files: generatedFiles, report };
}
