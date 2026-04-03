import type { ParseResult, MethodInfo } from "./types";

/** Maps common Spring HttpStatus names to NestJS HttpStatus values */
const STATUS_MAP: Record<string, string> = {
  NOT_FOUND: "HttpStatus.NOT_FOUND",
  BAD_REQUEST: "HttpStatus.BAD_REQUEST",
  CONFLICT: "HttpStatus.CONFLICT",
  FORBIDDEN: "HttpStatus.FORBIDDEN",
  UNAUTHORIZED: "HttpStatus.UNAUTHORIZED",
  UNPROCESSABLE_ENTITY: "HttpStatus.UNPROCESSABLE_ENTITY",
  INTERNAL_SERVER_ERROR: "HttpStatus.INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "HttpStatus.SERVICE_UNAVAILABLE",
  METHOD_NOT_ALLOWED: "HttpStatus.METHOD_NOT_ALLOWED",
  GONE: "HttpStatus.GONE",
};

/**
 * Generate a NestJS ExceptionFilter from a Spring @RestControllerAdvice / @ControllerAdvice class.
 * When @ExceptionHandler methods are extracted, generates typed handler branches.
 */
export function generateExceptionFilter(cls: ParseResult): string {
  const filterName = cls.className
    .replace(/Handler$/, "Filter")
    .replace(/Advice$/, "Filter");

  const handlers = (cls.methods ?? []).filter((m) => m.bodyType);
  const lines: string[] = [];

  lines.push(`// AUTO-MIGRATED from ${cls.className} (@RestControllerAdvice)`);
  lines.push(`import {`);
  lines.push(`  ExceptionFilter,`);
  lines.push(`  Catch,`);
  lines.push(`  ArgumentsHost,`);
  lines.push(`  HttpException,`);
  lines.push(`  HttpStatus,`);
  lines.push(`} from '@nestjs/common';`);
  lines.push("");
  lines.push(`@Catch()`);
  lines.push(`export class ${filterName} implements ExceptionFilter {`);
  lines.push(`  catch(exception: unknown, host: ArgumentsHost): void {`);
  lines.push(`    const ctx = host.switchToHttp();`);
  lines.push(`    const response = ctx.getResponse();`);
  lines.push("");

  if (handlers.length > 0) {
    // Generate typed handler branches from extracted @ExceptionHandler methods
    lines.push(`    let status = HttpStatus.INTERNAL_SERVER_ERROR;`);
    lines.push(`    let message: string = 'Internal error';`);
    lines.push("");
    for (const h of handlers) {
      const exceptionType = h.bodyType!;
      const nestStatus = h.httpMethod
        ? (STATUS_MAP[h.httpMethod] ?? `HttpStatus.${h.httpMethod}`)
        : inferStatusFromException(exceptionType);
      lines.push(`    // @ExceptionHandler(${exceptionType}) → ${h.name}()`);
      lines.push(
        `    // TODO: migrate handler logic from ${cls.className}.${h.name}()`,
      );
      lines.push(`    // Original mapped status: ${nestStatus}`);
      lines.push("");
    }
    lines.push(`    if (exception instanceof HttpException) {`);
    lines.push(`      status = exception.getStatus();`);
    lines.push(`      message = exception.message;`);
    lines.push(`    } else if (exception instanceof Error) {`);
    lines.push(`      message = exception.message;`);
    lines.push(`    }`);
  } else {
    lines.push(`    const status =`);
    lines.push(`      exception instanceof HttpException`);
    lines.push(`        ? exception.getStatus()`);
    lines.push(`        : HttpStatus.INTERNAL_SERVER_ERROR;`);
    lines.push("");
    lines.push(
      `    const message = exception instanceof Error ? exception.message : 'Internal error';`,
    );
  }

  lines.push("");
  lines.push(`    response.status(status).json({`);
  lines.push(`      statusCode: status,`);
  lines.push(`      message,`);
  lines.push(`    });`);
  lines.push(`  }`);
  lines.push("}");

  return lines.join("\n");
}

function inferStatusFromException(exceptionType: string): string {
  const lower = exceptionType.toLowerCase();
  if (lower.includes("notfound") || lower.includes("entitynotfound"))
    return "HttpStatus.NOT_FOUND";
  if (lower.includes("validation") || lower.includes("illegalargument"))
    return "HttpStatus.BAD_REQUEST";
  if (lower.includes("access") || lower.includes("forbidden"))
    return "HttpStatus.FORBIDDEN";
  if (lower.includes("unauthorized") || lower.includes("authentication"))
    return "HttpStatus.UNAUTHORIZED";
  if (lower.includes("conflict") || lower.includes("duplicate"))
    return "HttpStatus.CONFLICT";
  return "HttpStatus.INTERNAL_SERVER_ERROR";
}
