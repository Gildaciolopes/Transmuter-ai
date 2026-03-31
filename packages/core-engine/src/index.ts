export { generateZodSchema } from './zod-generator';
export { flattenInheritance } from './inheritance-flattener';
export { generatePrismaModel, generatePrismaSchema } from './prisma-generator';
export { resolveRelations, getDirectivesForClass } from './relation-resolver';
export { generateNestService, generateNestController, generateNestModule, generateTsEnum } from './nestjs-generator';
export { generateDto } from './dto-generator';
export { generateRepository } from './repository-generator';
export { generateComponent, generateConfiguration } from './component-generator';
export { generateExceptionFilter } from './exception-handler-generator';
export { javaPackageToOutputPath, packageToFolder, classNameToFileBase } from './path-mapper';
export { javaToZod, javaToPrisma, javaToTs } from './type-map';
export type {
  ClassStereotype,
  RelationType,
  RelationInfo,
  EnumValue,
  FieldInfo,
  ConstraintInfo,
  ParamInfo,
  MethodInfo,
  ParseResult,
  ParseResponse,
  ProjectParseResponse,
  PrismaRelationDirective,
  ConvertResult,
  GeneratedFile,
  MigrationReport,
  FlaggedItem,
  StubItem,
  SkippedItem,
} from './types';
