import type { ParseResult } from './types';

/**
 * Generate a NestJS ExceptionFilter from a Spring @RestControllerAdvice / @ControllerAdvice class.
 */
export function generateExceptionFilter(cls: ParseResult): string {
  const filterName = cls.className
    .replace(/Handler$/, 'Filter')
    .replace(/Advice$/, 'Filter');

  // Extract @ExceptionHandler method info from methods[] if available
  const handlerNotes = (cls.methods ?? [])
    .map((m) => `  // Handler: ${m.name}() — ${m.returnType}`)
    .join('\n');

  const lines: string[] = [];

  lines.push(`// AUTO-MIGRATED from ${cls.className} (@RestControllerAdvice)`);
  lines.push(`import {`);
  lines.push(`  ExceptionFilter,`);
  lines.push(`  Catch,`);
  lines.push(`  ArgumentsHost,`);
  lines.push(`  HttpException,`);
  lines.push(`  HttpStatus,`);
  lines.push(`} from '@nestjs/common';`);
  lines.push('');
  lines.push(`@Catch()`);
  lines.push(`export class ${filterName} implements ExceptionFilter {`);
  if (handlerNotes) {
    lines.push(handlerNotes);
  }
  lines.push(`  catch(exception: unknown, host: ArgumentsHost): void {`);
  lines.push(`    const ctx = host.switchToHttp();`);
  lines.push(`    const response = ctx.getResponse();`);
  lines.push('');
  lines.push(`    const status =`);
  lines.push(`      exception instanceof HttpException`);
  lines.push(`        ? exception.getStatus()`);
  lines.push(`        : HttpStatus.INTERNAL_SERVER_ERROR;`);
  lines.push('');
  lines.push(`    response.status(status).json({`);
  lines.push(`      statusCode: status,`);
  lines.push(`      message: exception instanceof Error ? exception.message : 'Internal error',`);
  lines.push(`    });`);
  lines.push(`  }`);
  lines.push('}');

  return lines.join('\n');
}
