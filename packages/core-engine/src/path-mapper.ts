/**
 * Maps Java package + class name + stereotype → TypeScript output file path.
 *
 * Example:
 *   javaPackageToOutputPath('com.example.app.user', 'UserService', 'service')
 *   → 'src/user/user.service.ts'
 */
export function javaPackageToOutputPath(
  packageName: string,
  className: string,
  fileType: FileType,
): string {
  const folder = packageToFolder(packageName);
  const base = classNameToFileBase(className, fileType);

  const suffix = FILE_SUFFIXES[fileType];
  return `${folder}/${base}.${suffix}.ts`;
}

export type FileType =
  | 'entity'
  | 'service'
  | 'controller'
  | 'module'
  | 'dto'
  | 'enum'
  | 'zod'
  | 'repository'
  | 'component'
  | 'filter';

const FILE_SUFFIXES: Record<FileType, string> = {
  entity: 'entity',
  service: 'service',
  controller: 'controller',
  module: 'module',
  dto: 'dto',
  enum: 'enum',
  zod: 'schema',
  repository: 'repository',
  component: 'component',
  filter: 'filter',
};

/**
 * Converts a Java package to a folder path under src/.
 * Uses only the last meaningful segment if a conventional base is detected.
 * e.g. 'com.example.app.user' → 'src/user'
 * e.g. 'com.example.app.user.dto' → 'src/user/dto'
 */
export function packageToFolder(packageName: string): string {
  if (!packageName) return 'src';

  const parts = packageName.split('.');

  // Heuristic: skip common root prefixes (com, org, net, br, io) and the next segment
  // E.g. com.example.app.user → keep from "app.user" or just "user"
  // We drop the first two segments if they look like tld.company
  const knownTlds = new Set(['com', 'org', 'net', 'br', 'io', 'dev', 'app']);
  let start = 0;
  if (knownTlds.has(parts[0])) {
    start = Math.min(2, parts.length - 1); // skip tld + company
  }

  // Also skip an "app" or "application" segment right after company
  if (parts[start] === 'app' || parts[start] === 'application') {
    start = Math.min(start + 1, parts.length - 1);
  }

  const relevant = parts.slice(start);
  return 'src/' + relevant.join('/');
}

/**
 * Converts a PascalCase class name to a kebab-case file base,
 * stripping the stereotype suffix when it matches the file type.
 * e.g. 'UserService' + type 'service' → 'user'
 * e.g. 'UserController' + type 'controller' → 'user'
 * e.g. 'CreateUserDto' + type 'dto' → 'create-user'
 * e.g. 'OrderStatus' + type 'enum' → 'order-status'
 */
export function classNameToFileBase(className: string, fileType?: FileType): string {
  let name = className;

  if (fileType) {
    const suffixes: Partial<Record<FileType, string[]>> = {
      service: ['Service'],
      controller: ['Controller', 'RestController'],
      module: ['Service', 'Controller', 'Module', 'Configuration', 'Config'],
      dto: ['Dto', 'DTO', 'Request', 'Response', 'Form', 'Payload', 'Command', 'Body'],
      repository: ['Repository'],
      component: [],
      filter: ['Handler', 'Advice', 'Filter'],
    };
    for (const suffix of suffixes[fileType] ?? []) {
      if (name.endsWith(suffix)) {
        name = name.slice(0, -suffix.length);
        break;
      }
    }
  }

  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}
