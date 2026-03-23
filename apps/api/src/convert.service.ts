import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import {
  generateZodSchema,
  generatePrismaModel,
  ParseResponse,
} from "@transmuter/core-engine";

@Injectable()
export class ConvertService {
  private parserUrl: string;

  constructor() {
    this.parserUrl = process.env.PARSER_URL ?? "http://localhost:4000";
  }

  async convert(javaCode: string) {
    // Call the Java parser service
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

    // Convert each entity
    const results = parseResponse.entities.map((entity) => ({
      className: entity.className,
      zod: generateZodSchema(entity),
      prisma: generatePrismaModel(entity),
    }));

    return { results };
  }

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
}
