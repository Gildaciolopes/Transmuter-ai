import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import {
  generateZodSchema,
  generatePrismaModel,
  generatePrismaSchema,
  generateNestService,
  generateNestController,
  generateNestModule,
  generateTsEnum,
  generateDto,
  generateRepository,
  generateComponent,
  generateConfiguration,
  generateExceptionFilter,
  resolveRelations,
  flattenInheritance,
  javaPackageToOutputPath,
  ParseResponse,
  ProjectParseResponse,
  GeneratedFile,
  MigrationReport,
  FlaggedItem,
  StubItem,
  SkippedItem,
} from "@transmuter/core-engine";

@Injectable()
export class ConvertService {
  private parserUrl: string;

  constructor() {
    this.parserUrl = process.env.PARSER_URL ?? "http://localhost:4000";
  }

  // ─────────── /convert/simple ───────────

  async convert(javaCode: string) {
    const parseResponse = await this.callParser(javaCode);

    if (parseResponse.error) {
      throw new HttpException(
        `Parser error: ${parseResponse.error}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (parseResponse.entities.length === 0) {
      throw new HttpException(
        "No @Entity classes found. This tool converts JPA entity classes (annotated with @Entity) to Zod schemas and Prisma models. Try pasting a class like: @Entity public class User { @Id private Long id; @Column private String name; }",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const results = parseResponse.entities.map((entity) => ({
      className: entity.className,
      zod: generateZodSchema(entity),
      prisma: generatePrismaModel(entity),
    }));

    return { results };
  }

  // ─────────── /convert/project ───────────

  async convertProject(files: Array<{ path: string; content: string }>) {
    const projectResponse = await this.callProjectParser(files);

    if (projectResponse.error) {
      throw new HttpException(
        `Parser error: ${projectResponse.error}`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const totalClasses =
      projectResponse.classes.length + projectResponse.enums.length;
    if (totalClasses === 0) {
      throw new HttpException(
        "No recognizable Java classes found in the provided files.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Flatten @MappedSuperclass fields into child entities
    const flatResponse = flattenInheritance(projectResponse);

    // Resolve JPA relations across the class graph
    const directives = resolveRelations(flatResponse);

    // Generate full schema.prisma
    const prismaSchema = generatePrismaSchema(flatResponse, directives);

    const generatedFiles: GeneratedFile[] = [];
    const flaggedItems: FlaggedItem[] = [];
    const stubItems: StubItem[] = [];
    const skippedItems: SkippedItem[] = [];
    let converted = 0;

    for (const cls of flatResponse.classes) {
      try {
        switch (cls.stereotype) {
          // ── Fully converted ──────────────────────────────────────
          case "entity": {
            const zodPath = javaPackageToOutputPath(cls.packageName, cls.className, "zod");
            generatedFiles.push({ path: zodPath, content: generateZodSchema(cls), type: "zod" });
            converted++;
            break;
          }
          case "service": {
            const svcPath = javaPackageToOutputPath(cls.packageName, cls.className, "service");
            const modPath = javaPackageToOutputPath(cls.packageName, cls.className, "module");
            generatedFiles.push({ path: svcPath, content: generateNestService(cls), type: "nestjs-service" });
            generatedFiles.push({ path: modPath, content: generateNestModule(cls), type: "nestjs-module" });
            converted++;
            break;
          }
          case "controller": {
            const ctrlPath = javaPackageToOutputPath(cls.packageName, cls.className, "controller");
            generatedFiles.push({ path: ctrlPath, content: generateNestController(cls), type: "nestjs-controller" });
            converted++;
            break;
          }
          case "dto": {
            const dtoPath = javaPackageToOutputPath(cls.packageName, cls.className, "dto");
            generatedFiles.push({ path: dtoPath, content: generateDto(cls), type: "dto" });
            converted++;
            break;
          }
          case "repository": {
            const repoPath = javaPackageToOutputPath(cls.packageName, cls.className, "repository");
            generatedFiles.push({ path: repoPath, content: generateRepository(cls), type: "nestjs-repository" });
            converted++;
            break;
          }

          // ── Stubs — compilable but require manual review ──────────
          case "component": {
            const compPath = javaPackageToOutputPath(cls.packageName, cls.className, "component");
            generatedFiles.push({ path: compPath, content: generateComponent(cls), type: "nestjs-component" });
            stubItems.push({ className: cls.className, reason: "Generic @Component — stub generated, implement methods manually" });
            break;
          }
          case "exception-handler": {
            const filterPath = javaPackageToOutputPath(cls.packageName, cls.className, "filter");
            generatedFiles.push({ path: filterPath, content: generateExceptionFilter(cls), type: "nestjs-exception-filter" });
            stubItems.push({ className: cls.className, reason: "@RestControllerAdvice — ExceptionFilter stub generated, map handler methods manually" });
            break;
          }
          case "configuration": {
            const confPath = javaPackageToOutputPath(cls.packageName, cls.className, "module");
            generatedFiles.push({ path: confPath, content: generateConfiguration(cls), type: "nestjs-configuration" });
            stubItems.push({ className: cls.className, reason: "@Configuration — @Module stub generated, wire providers manually" });
            break;
          }

          // ── Skipped — no NestJS equivalent needed ─────────────────
          case "skip": {
            skippedItems.push({ className: cls.className, reason: "Infrastructure class (@SpringBootApplication, servlet config, etc.) — no NestJS equivalent" });
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

    // Enums
    for (const enumCls of flatResponse.enums) {
      try {
        const enumPath = javaPackageToOutputPath(enumCls.packageName, enumCls.className, "enum");
        generatedFiles.push({ path: enumPath, content: generateTsEnum(enumCls), type: "enum" });
        converted++;
      } catch (err) {
        flaggedItems.push({
          className: enumCls.className,
          reason: `Enum generation error: ${(err as Error).message}`,
        });
      }
    }

    // Add schema.prisma
    generatedFiles.push({ path: "schema.prisma", content: prismaSchema, type: "prisma-schema" });

    const report: MigrationReport = {
      totalClasses,
      converted,
      stubs: stubItems.length,
      skipped: skippedItems.length,
      flagged: flaggedItems.length,
      stubItems,
      skippedItems,
      flaggedItems,
    };

    return { prismaSchema, files: generatedFiles, report };
  }

  // ─────────── Parser calls ───────────

  private async callParser(code: string): Promise<ParseResponse> {
    try {
      const res = await fetch(`${this.parserUrl}/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      return (await res.json()) as ParseResponse;
    } catch (err) {
      throw new HttpException(
        `Failed to reach parser service at ${this.parserUrl}: ${(err as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async callProjectParser(
    files: Array<{ path: string; content: string }>,
  ): Promise<ProjectParseResponse> {
    try {
      const res = await fetch(`${this.parserUrl}/parse/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      return (await res.json()) as ProjectParseResponse;
    } catch (err) {
      throw new HttpException(
        `Failed to reach parser service at ${this.parserUrl}: ${(err as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
