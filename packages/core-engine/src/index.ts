export { generateZodSchema } from './zod-generator';
export { generatePrismaModel, generatePrismaSchema } from './prisma-generator';
export { resolveRelations, getDirectivesForClass } from './relation-resolver';
export { generateNestService, generateNestController, generateNestModule, generateTsEnum } from './nestjs-generator';
export { generateDto } from './dto-generator';
export { javaPackageToOutputPath, packageToFolder, classNameToFileBase } from './path-mapper';
export { javaToZod, javaToPrisma } from './type-map';
export type {
  ClassStereotype,
  RelationType,
  RelationInfo,
  EnumValue,
  FieldInfo,
  ParseResult,
  ParseResponse,
  ProjectParseResponse,
  PrismaRelationDirective,
  ConvertResult,
  GeneratedFile,
  MigrationReport,
  FlaggedItem,
} from './types';
