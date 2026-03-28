import type { ParseResult } from './types';
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
  lines.push("");
  lines.push(`export const ${entity.className}Schema = z.object({`);

  for (const field of entity.fields) {
    if (field.isTransient) continue;

    let zodType: string;
    if (field.relation) {
      const target = field.relation.targetClass;
      const isArray = field.type.startsWith('List') || field.type.startsWith('Set') || field.type.startsWith('Collection');
      // Use z.lazy for forward-references; array relations get wrapped
      const ref = `z.lazy(() => ${target}Schema)`;
      zodType = isArray ? `z.array(${ref})` : ref;
    } else {
      zodType = javaToZod[field.type] ?? 'z.string()';
    }

    const suffix = field.nullable ? '.optional()' : '';
    lines.push(`  ${field.name}: ${zodType}${suffix},`);
  }

  lines.push("});");
  lines.push("");
  lines.push(
    `export type ${entity.className} = z.infer<typeof ${entity.className}Schema>;`,
  );

  return lines.join("\n");
}
