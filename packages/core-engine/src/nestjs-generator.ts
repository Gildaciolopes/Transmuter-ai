import type { ParseResult, MethodInfo } from './types';

const HTTP_METHOD_MAP: Record<string, string> = {
  GetMapping: 'Get',
  PostMapping: 'Post',
  PutMapping: 'Put',
  DeleteMapping: 'Delete',
  PatchMapping: 'Patch',
  RequestMapping: 'All',
};

/**
 * Generate a NestJS @Injectable() service from a Spring @Service class.
 */
export function generateNestService(cls: ParseResult): string {
  const className = cls.className;
  const lines: string[] = [];

  lines.push(`import { Injectable } from '@nestjs/common';`);
  lines.push(`import { PrismaService } from '../prisma/prisma.service';`);
  lines.push('');
  lines.push('@Injectable()');
  lines.push(`export class ${className} {`);
  lines.push(`  constructor(private readonly prisma: PrismaService) {}`);
  lines.push('');
  lines.push(`  // TODO: implement service methods`);
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate a NestJS @Controller() from a Spring @RestController class.
 * Uses extracted HTTP methods when available, falls back to generic CRUD stubs.
 */
export function generateNestController(cls: ParseResult): string {
  const className = cls.className;
  const resource = cls.requestMapping
    ? cls.requestMapping.replace(/^\/?(api\/)?/, '').replace(/\/$/, '')
    : className.replace(/Controller$/, '').toLowerCase();
  const serviceName = className.replace(/Controller$/, 'Service');

  // Collect DTO imports needed for @Body() types (skip primitives and Object/unknown)
  const dtoImports = new Set<string>();
  const methods = cls.methods ?? [];
  for (const m of methods) {
    if (m.bodyType && !isPrimitive(m.bodyType) && m.bodyType !== 'Object' && m.bodyType !== 'unknown') {
      dtoImports.add(m.bodyType);
    }
  }

  const lines: string[] = [];

  // Build import decorators list
  const decoratorImports = new Set(['Controller', 'Param', 'Body']);
  for (const m of methods) {
    const nestDecorator = httpMethodToNestDecorator(m.httpMethod);
    decoratorImports.add(nestDecorator);
    for (const p of m.params) {
      if (p.source === 'query') decoratorImports.add('Query');
      if (p.source === 'header') decoratorImports.add('Headers');
    }
  }
  if (methods.length === 0) {
    ['Get', 'Post', 'Put', 'Delete'].forEach((d) => decoratorImports.add(d));
  }

  lines.push(`import { ${[...decoratorImports].sort().join(', ')} } from '@nestjs/common';`);
  lines.push(`import { ${serviceName} } from './${resource}.service';`);
  for (const dto of dtoImports) {
    lines.push(`import { ${dto} } from './${toKebabCase(dto)}.dto';`);
  }
  lines.push('');
  lines.push(`@Controller('${resource}')`);
  lines.push(`export class ${className} {`);
  lines.push(`  constructor(private readonly ${lcFirst(serviceName)}: ${serviceName}) {}`);
  lines.push('');

  if (methods.length > 0) {
    for (const method of methods) {
      lines.push(...renderMethod(method));
      lines.push('');
    }
  } else {
    // Fallback: generic CRUD stubs
    lines.push(...GENERIC_CRUD_STUBS);
    lines.push('');
  }

  lines.push('}');

  return lines.join('\n');
}

function renderMethod(method: MethodInfo): string[] {
  const nestDecorator = httpMethodToNestDecorator(method.httpMethod);
  // Convert Java-style path params /{id} → NestJS :id style
  const nestPath = method.path
    ? method.path.replace(/\{(\w+)\}/g, ':$1')
    : '';
  const pathArg = nestPath ? `('${nestPath}')` : '()';
  const lines: string[] = [];

  lines.push(`  @${nestDecorator}${pathArg}`);

  // Build parameter list
  const params: string[] = [];
  for (const p of method.params) {
    if (p.source === 'path') params.push(`@Param('${p.name}') ${p.name}: string`);
    else if (p.source === 'query') params.push(`@Query('${p.name}') ${p.name}: string`);
    else if (p.source === 'header') params.push(`@Headers('${p.name}') ${p.name}: string`);
  }
  if (method.bodyType) {
    const tsType =
      isPrimitive(method.bodyType) || method.bodyType === 'Object' ? 'unknown' : method.bodyType;
    params.push(`@Body() body: ${tsType}`);
  }

  lines.push(`  ${method.name}(${params.join(', ')}) {`);
  lines.push(`    // TODO: migrate ${method.name}`);
  lines.push(`  }`);
  return lines;
}

const GENERIC_CRUD_STUBS = [
  `  @Get()`,
  `  findAll() {`,
  `    // TODO: implement`,
  `  }`,
  ``,
  `  @Get(':id')`,
  `  findOne(@Param('id') id: string) {`,
  `    // TODO: implement`,
  `  }`,
  ``,
  `  @Post()`,
  `  create(@Body() body: unknown) {`,
  `    // TODO: implement`,
  `  }`,
  ``,
  `  @Put(':id')`,
  `  update(@Param('id') id: string, @Body() body: unknown) {`,
  `    // TODO: implement`,
  `  }`,
  ``,
  `  @Delete(':id')`,
  `  remove(@Param('id') id: string) {`,
  `    // TODO: implement`,
  `  }`,
];

/**
 * Generate a NestJS @Module() that wires service + controller together.
 */
export function generateNestModule(cls: ParseResult): string {
  const baseName = cls.className.replace(/Service$|Controller$/, '');
  const serviceName = `${baseName}Service`;
  const controllerName = `${baseName}Controller`;
  const moduleName = `${baseName}Module`;
  const fileBase = baseName.toLowerCase();

  const lines: string[] = [];
  lines.push(`import { Module } from '@nestjs/common';`);
  lines.push(`import { ${controllerName} } from './${fileBase}.controller';`);
  lines.push(`import { ${serviceName} } from './${fileBase}.service';`);
  lines.push(`import { PrismaModule } from '../prisma/prisma.module';`);
  lines.push('');
  lines.push('@Module({');
  lines.push(`  imports: [PrismaModule],`);
  lines.push(`  controllers: [${controllerName}],`);
  lines.push(`  providers: [${serviceName}],`);
  lines.push(`  exports: [${serviceName}],`);
  lines.push('})');
  lines.push(`export class ${moduleName} {}`);

  return lines.join('\n');
}

/**
 * Generate a TypeScript enum from a parsed Java enum.
 */
export function generateTsEnum(cls: ParseResult): string {
  const lines: string[] = [];
  lines.push(`export enum ${cls.className} {`);
  for (const val of cls.enumValues ?? []) {
    lines.push(`  ${val.name} = '${val.name}',`);
  }
  lines.push('}');
  return lines.join('\n');
}

// ─── Helpers ───────────────────────────────────────────────────────

function httpMethodToNestDecorator(httpMethod: string): string {
  const map: Record<string, string> = {
    GET: 'Get',
    POST: 'Post',
    PUT: 'Put',
    DELETE: 'Delete',
    PATCH: 'Patch',
  };
  return map[httpMethod] ?? 'Get';
}

function isPrimitive(type: string): boolean {
  return ['String', 'Long', 'Integer', 'Boolean', 'Double', 'Float', 'int', 'long', 'boolean', 'double', 'float', 'void', 'Void'].includes(type);
}

function toKebabCase(name: string): string {
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

function lcFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
