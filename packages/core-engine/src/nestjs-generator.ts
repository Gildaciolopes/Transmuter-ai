import type { ParseResult } from './types';

// Mapping of Spring HTTP annotations to NestJS equivalents
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
 * Maps common HTTP method annotations.
 */
export function generateNestController(cls: ParseResult): string {
  const className = cls.className;
  // Derive resource name: UserController → user
  const resource = className.replace(/Controller$/, '').toLowerCase();
  const serviceName = className.replace(/Controller$/, 'Service');

  const nestDecorators = new Set<string>(['Controller']);

  // Collect HTTP method imports needed
  const httpImports = new Set<string>();
  for (const ann of cls.fields.flatMap((f) => f.annotations)) {
    const nestAnn = HTTP_METHOD_MAP[ann];
    if (nestAnn) httpImports.add(nestAnn);
  }

  const lines: string[] = [];
  const decoratorImports = ['Controller', 'Get', 'Post', 'Put', 'Delete', 'Param', 'Body'];
  lines.push(`import { ${decoratorImports.join(', ')} } from '@nestjs/common';`);
  lines.push(`import { ${serviceName} } from './${resource}.service';`);
  lines.push('');
  lines.push(`@Controller('${resource}')`);
  lines.push(`export class ${className} {`);
  lines.push(`  constructor(private readonly ${lcFirst(serviceName)}: ${serviceName}) {}`);
  lines.push('');
  lines.push(`  @Get()`);
  lines.push(`  findAll() {`);
  lines.push(`    // TODO: implement`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  @Get(':id')`);
  lines.push(`  findOne(@Param('id') id: string) {`);
  lines.push(`    // TODO: implement`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  @Post()`);
  lines.push(`  create(@Body() body: unknown) {`);
  lines.push(`    // TODO: implement`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  @Put(':id')`);
  lines.push(`  update(@Param('id') id: string, @Body() body: unknown) {`);
  lines.push(`    // TODO: implement`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  @Delete(':id')`);
  lines.push(`  remove(@Param('id') id: string) {`);
  lines.push(`    // TODO: implement`);
  lines.push(`  }`);
  lines.push('}');

  return lines.join('\n');
}

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

function lcFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
