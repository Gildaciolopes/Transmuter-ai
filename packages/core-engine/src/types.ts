export type ClassStereotype =
  | 'entity'
  | 'service'
  | 'repository'
  | 'controller'
  | 'component'
  | 'dto'
  | 'enum';

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

export interface FieldInfo {
  name: string;
  type: string;
  nullable: boolean;
  annotations: string[];
  relation?: RelationInfo;
  isTransient: boolean;
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
  type: 'zod' | 'nestjs-service' | 'nestjs-controller' | 'nestjs-module' | 'dto' | 'enum' | 'prisma-schema';
}

export interface MigrationReport {
  totalClasses: number;
  converted: number;
  flagged: number;
  skipped: number;
  flaggedItems: FlaggedItem[];
}

export interface FlaggedItem {
  className: string;
  reason: string;
}

export interface PrismaRelationDirective {
  ownerClass: string;
  ownerField: string;
  targetClass: string;
  relationType: RelationType;
  foreignKeyField: string;
  mappedBy?: string;
}
