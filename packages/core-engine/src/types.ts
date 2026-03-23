export interface FieldInfo {
  name: string;
  type: string;
  nullable: boolean;
  annotations: string[];
}

export interface ParseResult {
  className: string;
  fields: FieldInfo[];
  isEntity: boolean;
}

export interface ParseResponse {
  entities: ParseResult[];
  error?: string;
}

export interface ConvertResult {
  zod: string;
  prisma: string;
  className: string;
}
