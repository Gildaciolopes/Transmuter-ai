import type {
  ParseResult,
  ProjectParseResponse,
  PrismaRelationDirective,
  RelationType,
} from './types';

/**
 * Resolves JPA relation fields across the full class graph.
 *
 * Pass 1: build a map of className → ParseResult
 * Pass 2: for each relation field, determine ownership and synthesize FK directives
 *
 * Returns an array of PrismaRelationDirective objects that the Prisma generator
 * uses to render @relation() fields and implicit FK columns.
 */
export function resolveRelations(
  response: ProjectParseResponse,
): PrismaRelationDirective[] {
  const classMap = new Map<string, ParseResult>();
  for (const cls of response.classes) {
    classMap.set(cls.className, cls);
  }

  const directives: PrismaRelationDirective[] = [];

  for (const cls of response.classes) {
    for (const field of cls.fields) {
      if (!field.relation) continue;

      const rel = field.relation;
      const targetClass = rel.targetClass;

      // Only emit a directive from the owning side to avoid duplicates
      if (!rel.isOwning) continue;

      const fkField = buildForeignKeyFieldName(targetClass);

      directives.push({
        ownerClass: cls.className,
        ownerField: field.name,
        targetClass,
        relationType: rel.type as RelationType,
        foreignKeyField: fkField,
        mappedBy: rel.mappedBy,
      });
    }
  }

  return directives;
}

/**
 * Returns all relation directives that affect a specific class (as owner or target).
 */
export function getDirectivesForClass(
  directives: PrismaRelationDirective[],
  className: string,
): PrismaRelationDirective[] {
  return directives.filter(
    (d) => d.ownerClass === className || d.targetClass === className,
  );
}

/**
 * Synthesizes the FK field name for a relation.
 * e.g. targetClass="Order" → "orderId"
 */
function buildForeignKeyFieldName(targetClass: string): string {
  return targetClass.charAt(0).toLowerCase() + targetClass.slice(1) + 'Id';
}
