import type { ParseResult } from './types';

/**
 * Generate a NestJS @Injectable() stub from a Spring @Component class.
 * Produces compilable stubs for all public methods with TODO comments.
 */
export function generateComponent(cls: ParseResult): string {
  const lines: string[] = [];

  lines.push(`// AUTO-MIGRATED: review method implementations`);
  lines.push(`import { Injectable } from '@nestjs/common';`);
  lines.push('');
  lines.push(`@Injectable()`);
  lines.push(`export class ${cls.className} {`);
  lines.push(`  // TODO: migrate from ${cls.packageName}.${cls.className}`);
  lines.push(`  // Review and implement each method below`);
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate a NestJS @Module() stub from a Spring @Configuration class.
 */
export function generateConfiguration(cls: ParseResult): string {
  const moduleName = cls.className.replace(/Config(?:uration)?$/, '') + 'Module';
  const lines: string[] = [];

  lines.push(`// AUTO-MIGRATED: review configuration`);
  lines.push(`import { Module } from '@nestjs/common';`);
  lines.push('');
  lines.push(`@Module({`);
  lines.push(`  imports: [],`);
  lines.push(`  providers: [],`);
  lines.push(`  exports: [],`);
  lines.push(`})`);
  lines.push(`export class ${moduleName} {`);
  lines.push(`  // TODO: migrate configuration from ${cls.packageName}.${cls.className}`);
  lines.push('}');

  return lines.join('\n');
}
