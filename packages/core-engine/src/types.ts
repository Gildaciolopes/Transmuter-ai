export type ClassStereotype =
  | 'entity'
  | 'service'
  | 'repository'
  | 'controller'
  | 'component'
  | 'dto'
  | 'enum'
  | 'exception-handler'
  | 'configuration'
  | 'skip';

export type InheritanceStrategy = 'SINGLE_TABLE' | 'TABLE_PER_CLASS' | 'JOINED';

export type RelationType = 'OneToMany' | 'ManyToOne' | 'ManyToMany' | 'OneToOne';

export interface RelationInfo {
  type: RelationType;
  targetClass: string;
  mappedBy?: string;
  fieldName: string;
  isOwning: boolean;
}

export interface EnumValue {
  name: string;
  ordinal: number;
}

/** Validation constraints extracted from Bean Validation / @Column annotations */
export interface ConstraintInfo {
  notNull?: boolean;
  notBlank?: boolean;
  notEmpty?: boolean;
  email?: boolean;
  positive?: boolean;
  negative?: boolean;
  min?: number;
  max?: number;
  sizeMin?: number;
  sizeMax?: number;
  pattern?: string;
  columnLength?: number;
  unique?: boolean;
  precision?: number;
  scale?: number;
  [key: string]: unknown;
}

export interface FieldInfo {
  name: string;
  type: string;
  nullable: boolean;
  annotations: string[];
  relation?: RelationInfo;
  isTransient: boolean;
  /** Extracted from @GeneratedValue(strategy=...) */
  generationStrategy?: 'UUID' | 'SEQUENCE' | 'IDENTITY' | 'AUTO';
  /** Validation constraints from Bean Validation / @Column */
  constraints?: ConstraintInfo;
}

export interface ParamInfo {
  name: string;
  type: string;
  /** "path" | "query" | "body" | "header" | "unknown" */
  source: string;
}

export interface MethodInfo {
  name: string;
  httpMethod: string;
  path: string;
  returnType: string;
  params: ParamInfo[];
  bodyType?: string;
}

export interface ParseResult {
  className: string;
  packageName: string;
  stereotype: ClassStereotype;
  fields: FieldInfo[];
  isEntity: boolean;
  superClass?: string;
  enumValues?: EnumValue[];
  inheritanceStrategy?: InheritanceStrategy;
  isMappedSuperclass?: boolean;
  tableName?: string;
  requestMapping?: string;
  /** For repository interfaces: entity type, e.g. "Product" in JpaRepository<Product, String> */
  entityType?: string;
  /** For repository interfaces: id type, e.g. "String" in JpaRepository<Product, String> */
  idType?: string;
  /** HTTP methods extracted from controller/repository classes */
  methods?: MethodInfo[];
}

export interface ProjectParseResponse {
  classes: ParseResult[];
  enums: ParseResult[];
  error?: string;
}

/** Backward-compat: single-file parse response used by /convert/simple */
export interface ParseResponse {
  entities: ParseResult[];
  error?: string;
}

export interface ConvertResult {
  zod: string;
  prisma: string;
  className: string;
}

/** Used by /convert/project response */
export interface GeneratedFile {
  path: string;
  content: string;
  type:
    | 'zod'
    | 'nestjs-service'
    | 'nestjs-controller'
    | 'nestjs-module'
    | 'nestjs-repository'
    | 'nestjs-exception-filter'
    | 'nestjs-component'
    | 'nestjs-configuration'
    | 'dto'
    | 'enum'
    | 'prisma-schema';
}

export interface FlaggedItem {
  className: string;
  reason: string;
}

export interface StubItem {
  className: string;
  reason: string;
}

export interface SkippedItem {
  className: string;
  reason: string;
}

export interface MigrationReport {
  totalClasses: number;
  converted: number;
  stubs: number;
  skipped: number;
  flagged: number;
  stubItems: StubItem[];
  skippedItems: SkippedItem[];
  flaggedItems: FlaggedItem[];
}

export interface PrismaRelationDirective {
  ownerClass: string;
  ownerField: string;
  targetClass: string;
  relationType: RelationType;
  foreignKeyField: string;
  mappedBy?: string;
}
