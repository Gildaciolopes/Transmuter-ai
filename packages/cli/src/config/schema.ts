import { z } from "zod";

export const LayersSchema = z.object({
  entities: z.boolean().default(true),
  services: z.boolean().default(true),
  controllers: z.boolean().default(true),
  dtos: z.boolean().default(true),
  enums: z.boolean().default(true),
});

export const TransmuterConfigSchema = z.object({
  version: z.literal("1").default("1"),
  source: z.string().default("./src/main/java"),
  output: z.string().default("./transmuter-output"),
  layers: LayersSchema.default({}),
  prismaOutput: z.string().default("./transmuter-output/schema.prisma"),
  packageRoot: z.string().optional(),
  nestjsModuleStyle: z.enum(["feature-modules"]).default("feature-modules"),
  dryRun: z.boolean().default(false),
});

export type TransmuterConfig = z.infer<typeof TransmuterConfigSchema>;
export type Layers = z.infer<typeof LayersSchema>;
