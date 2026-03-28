import type { ParseResult, ProjectParseResponse } from './types';

/**
 * Flattens @MappedSuperclass inheritance into child entities.
 *
 * For each entity that has a superClass pointing to a @MappedSuperclass,
 * the parent's fields are prepended to the child's field list.
 * The process is recursive: grandparent fields are resolved first.
 *
 * @MappedSuperclass classes themselves are removed from the output
 * since they don't map to their own Prisma model.
 */
export function flattenInheritance(response: ProjectParseResponse): ProjectParseResponse {
  // Build a lookup map for all classes including mapped superclasses
  const classMap = new Map<string, ParseResult>();
  for (const cls of response.classes) {
    classMap.set(cls.className, cls);
  }

  // Memoize already-flattened classes to avoid redundant work
  const flattened = new Map<string, ParseResult>();

  function flattenClass(cls: ParseResult): ParseResult {
    if (flattened.has(cls.className)) return flattened.get(cls.className)!;

    if (!cls.superClass) {
      flattened.set(cls.className, cls);
      return cls;
    }

    const parent = classMap.get(cls.superClass);
    if (!parent || !parent.isMappedSuperclass) {
      // Parent isn't a MappedSuperclass (or not found) — nothing to inline
      flattened.set(cls.className, cls);
      return cls;
    }

    // Flatten parent first (recursive)
    const flatParent = flattenClass(parent);

    // Prepend parent fields that aren't already on the child
    const childFieldNames = new Set(cls.fields.map((f) => f.name));
    const inheritedFields = flatParent.fields.filter((f) => !childFieldNames.has(f.name));

    const result: ParseResult = {
      ...cls,
      fields: [...inheritedFields, ...cls.fields],
    };

    flattened.set(cls.className, result);
    return result;
  }

  const flattenedClasses = response.classes
    .filter((cls) => !cls.isMappedSuperclass) // remove abstract base classes
    .map(flattenClass);

  return { ...response, classes: flattenedClasses };
}
