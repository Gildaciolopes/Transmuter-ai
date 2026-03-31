import type { ParseResult, ConstraintInfo } from './types';
import { javaToZod } from './type-map';
import { classNameToFileBase } from './path-mapper';

export function generateZodSchema(entity: ParseResult): string {
  const lines: string[] = [];

  // Collect related schema imports
  const relatedClasses = new Set<string>();
  for (const field of entity.fields) {
    if (field.relation) relatedClasses.add(field.relation.targetClass);
  }

  lines.push('import { z } from "zod";');
  if (relatedClasses.size > 0) {
    for (const related of relatedClasses) {
      const schemaName = `${related}Schema`;
      const filePath = `./${classNameToFileBase(related)}.schema`;
      lines.push(`import { ${schemaName} } from '${filePath}';`);
    }
  }
  lines.push('');
  lines.push(`export const ${entity.className}Schema = z.object({`);

  for (const field of entity.fields) {
    if (field.isTransient) continue;

    let zodType: string;
    if (field.relation) {
      const target = field.relation.targetClass;
      const isArray =
        field.type.startsWith('List') ||
        field.type.startsWith('Set') ||
        field.type.startsWith('Collection');
      const ref = `z.lazy(() => ${target}Schema)`;
      zodType = isArray ? `z.array(${ref})` : ref;
    } else {
      zodType = javaToZod[field.type] ?? 'z.string()';
      // Apply validation constraints on top of the base type
      zodType = applyConstraints(zodType, field.constraints ?? {}, field.type);
    }

    const suffix = field.nullable ? '.optional()' : '';
    lines.push(`  ${field.name}: ${zodType}${suffix},`);
  }

  lines.push('});');
  lines.push('');
  lines.push(`export type ${entity.className} = z.infer<typeof ${entity.className}Schema>;`);

  return lines.join('\n');
}

/**
 * Append Zod chain methods based on extracted validation constraints.
 */
function applyConstraints(zodBase: string, constraints: ConstraintInfo, javaType: string): string {
  let chain = zodBase;

  // String-based constraints
  if (chain.startsWith('z.string()')) {
    if (constraints.email) chain += '.email()';
    if (constraints.notBlank || constraints.notEmpty) chain += '.min(1)';
    if (constraints.sizeMin !== undefined) chain += `.min(${constraints.sizeMin})`;
    if (constraints.sizeMax !== undefined) chain += `.max(${constraints.sizeMax})`;
    if (constraints.columnLength !== undefined && constraints.sizeMax === undefined) {
      chain += `.max(${constraints.columnLength})`;
    }
    if (constraints.pattern) chain += `.regex(new RegExp('${constraints.pattern.replace(/'/g, "\\'")}'))`;
  }

  // Number-based constraints
  if (chain.startsWith('z.number()')) {
    if (constraints.positive) chain += '.positive()';
    if (constraints.negative) chain += '.negative()';
    if (constraints.min !== undefined && !constraints.positive) chain += `.min(${constraints.min})`;
    if (constraints.max !== undefined) chain += `.max(${constraints.max})`;
  }

  return chain;
}
