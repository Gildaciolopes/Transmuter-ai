import type { ParseResult, MethodInfo } from './types';
import { javaToTs } from './type-map';

/**
 * Generate a NestJS @Injectable() repository from a Spring Data JPA repository interface.
 * Produces Prisma-based CRUD + derived query methods.
 */
export function generateRepository(repo: ParseResult): string {
  const entityType = repo.entityType ?? repo.className.replace(/Repository$/, '');
  const idType = mapIdType(repo.idType ?? 'Long');
  const modelName = lcFirst(entityType);
  const prismaCreate = `Prisma.${entityType}CreateInput`;
  const prismaUpdate = `Prisma.${entityType}UpdateInput`;

  const lines: string[] = [];

  lines.push(`import { Injectable } from '@nestjs/common';`);
  lines.push(`import { PrismaService } from '../prisma/prisma.service';`);
  lines.push(`import { Prisma } from '@prisma/client';`);
  lines.push('');
  lines.push('@Injectable()');
  lines.push(`export class ${repo.className} {`);
  lines.push(`  constructor(private readonly prisma: PrismaService) {}`);
  lines.push('');

  // Standard CRUD methods from JpaRepository
  lines.push(`  findAll() {`);
  lines.push(`    return this.prisma.${modelName}.findMany();`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  findById(id: ${idType}) {`);
  lines.push(`    return this.prisma.${modelName}.findUnique({ where: { id } });`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  save(data: ${prismaCreate}) {`);
  lines.push(`    return this.prisma.${modelName}.create({ data });`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  update(id: ${idType}, data: ${prismaUpdate}) {`);
  lines.push(`    return this.prisma.${modelName}.update({ where: { id }, data });`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  delete(id: ${idType}) {`);
  lines.push(`    return this.prisma.${modelName}.delete({ where: { id } });`);
  lines.push(`  }`);

  // Derived methods from Spring Data method-name conventions
  for (const method of repo.methods ?? []) {
    const derived = derivePrismaQuery(method.name, modelName, entityType);
    if (derived) {
      lines.push('');
      lines.push(`  // Derived from: ${method.name}()`);
      lines.push(`  ${derived.signature} {`);
      lines.push(`    return ${derived.body};`);
      lines.push(`  }`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

// ─── Spring Data method-name → Prisma query ───────────────────────

interface DerivedMethod {
  signature: string;
  body: string;
}

function derivePrismaQuery(methodName: string, modelName: string, entityType: string): DerivedMethod | null {
  // Skip standard inherited methods
  const standardMethods = new Set(['findAll', 'findById', 'save', 'update', 'delete',
    'existsById', 'count', 'deleteAll', 'deleteById', 'findAllById']);
  if (standardMethods.has(methodName)) return null;

  // deleteBy{Field}
  const deleteMatch = methodName.match(/^deleteBy(.+)$/);
  if (deleteMatch) {
    const { whereClause, params } = parseWhereClause(deleteMatch[1]);
    return {
      signature: `${methodName}(${params.map((p) => `${p.name}: ${p.type}`).join(', ')})`,
      body: `this.prisma.${modelName}.deleteMany({ where: { ${whereClause} } })`,
    };
  }

  // countBy{Field}
  const countMatch = methodName.match(/^countBy(.+)$/);
  if (countMatch) {
    const { whereClause, params } = parseWhereClause(countMatch[1]);
    return {
      signature: `${methodName}(${params.map((p) => `${p.name}: ${p.type}`).join(', ')})`,
      body: `this.prisma.${modelName}.count({ where: { ${whereClause} } })`,
    };
  }

  // existsBy{Field}
  const existsMatch = methodName.match(/^existsBy(.+)$/);
  if (existsMatch) {
    const { whereClause, params } = parseWhereClause(existsMatch[1]);
    return {
      signature: `async ${methodName}(${params.map((p) => `${p.name}: ${p.type}`).join(', ')})`,
      body: `(await this.prisma.${modelName}.count({ where: { ${whereClause} } })) > 0`,
    };
  }

  // findFirstBy{Field}
  const findFirstMatch = methodName.match(/^findFirstBy(.+)$/);
  if (findFirstMatch) {
    const { whereClause, params, orderBy } = parseWhereClause(findFirstMatch[1]);
    const orderPart = orderBy ? `, orderBy: { ${orderBy} }` : '';
    return {
      signature: `${methodName}(${params.map((p) => `${p.name}: ${p.type}`).join(', ')})`,
      body: `this.prisma.${modelName}.findFirst({ where: { ${whereClause} }${orderPart} })`,
    };
  }

  // findAllBy{Field} or findBy{Field}
  const findAllMatch = methodName.match(/^(?:findAll|find)By(.+)$/);
  if (findAllMatch) {
    const { whereClause, params, orderBy } = parseWhereClause(findAllMatch[1]);
    const orderPart = orderBy ? `, orderBy: { ${orderBy} }` : '';
    const prismaMethod = methodName.startsWith('findAll') ? 'findMany' : 'findMany';
    return {
      signature: `${methodName}(${params.map((p) => `${p.name}: ${p.type}`).join(', ')})`,
      body: `this.prisma.${modelName}.${prismaMethod}({ where: { ${whereClause} }${orderPart} })`,
    };
  }

  return null;
}

interface ParsedWhere {
  whereClause: string;
  params: Array<{ name: string; type: string }>;
  orderBy?: string;
}

/**
 * Parse Spring Data where clause from method name suffix.
 * Examples: "Name" → { name }
 *           "IdAndActiveTrue" → { id, active: true }
 *           "NameOrderByCreatedAtAsc" → where: { name }, orderBy: { createdAt: 'asc' }
 *           "NameIn" → { name: { in: names } }
 */
function parseWhereClause(suffix: string): ParsedWhere {
  // Extract OrderBy clause first
  const orderByMatch = suffix.match(/OrderBy(\w+)(Asc|Desc)$/i);
  let orderBy: string | undefined;
  if (orderByMatch) {
    const field = lcFirst(orderByMatch[1]);
    const dir = orderByMatch[2].toLowerCase();
    orderBy = `${field}: '${dir}'`;
    suffix = suffix.replace(/OrderBy\w+(Asc|Desc)$/i, '');
  }

  // Split by And/Or
  const andParts = suffix.split(/(?=And[A-Z])/);
  const whereParts: string[] = [];
  const params: Array<{ name: string; type: string }> = [];
  const usedOr = suffix.includes('Or');

  for (const part of andParts) {
    const cleanPart = part.replace(/^And/, '');
    const parsed = parseSingleCondition(cleanPart);
    whereParts.push(parsed.clause);
    params.push(...parsed.params);
  }

  const whereClause = whereParts.length === 1 ? whereParts[0] : whereParts.join(', ');

  return { whereClause, params, orderBy };
}

interface SingleCondition {
  clause: string;
  params: Array<{ name: string; type: string }>;
}

function parseSingleCondition(part: string): SingleCondition {
  // {Field}True / {Field}False
  if (part.endsWith('True')) {
    const field = lcFirst(part.slice(0, -4));
    return { clause: `${field}: true`, params: [] };
  }
  if (part.endsWith('False')) {
    const field = lcFirst(part.slice(0, -5));
    return { clause: `${field}: false`, params: [] };
  }
  // {Field}IsNull / {Field}IsNotNull
  if (part.endsWith('IsNull')) {
    const field = lcFirst(part.slice(0, -6));
    return { clause: `${field}: null`, params: [] };
  }
  if (part.endsWith('IsNotNull')) {
    const field = lcFirst(part.slice(0, -9));
    return { clause: `${field}: { not: null }`, params: [] };
  }
  // {Field}In
  if (part.endsWith('In')) {
    const field = lcFirst(part.slice(0, -2));
    const plural = field + 's';
    return {
      clause: `${field}: { in: ${plural} }`,
      params: [{ name: plural, type: 'unknown[]' }],
    };
  }
  // {Field}Like / {Field}Contains
  if (part.endsWith('Like') || part.endsWith('Contains')) {
    const suffix = part.endsWith('Like') ? 'Like' : 'Contains';
    const field = lcFirst(part.slice(0, -suffix.length));
    return {
      clause: `${field}: { contains: ${field} }`,
      params: [{ name: field, type: 'string' }],
    };
  }
  // Default: equality on {Field}
  const field = lcFirst(part);
  return {
    clause: `${field}`,
    params: [{ name: field, type: 'unknown' }],
  };
}

function mapIdType(javaType: string): string {
  const map: Record<string, string> = {
    Long: 'bigint',
    long: 'bigint',
    Integer: 'number',
    int: 'number',
    String: 'string',
    UUID: 'string',
  };
  return map[javaType] ?? 'unknown';
}

function lcFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
