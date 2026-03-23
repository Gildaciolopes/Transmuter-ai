import { describe, it, expect } from "vitest";
import { generateZodSchema } from "./zod-generator";
import { ParseResult } from "./types";

const userEntity: ParseResult = {
  className: "User",
  isEntity: true,
  fields: [
    {
      name: "id",
      type: "Long",
      nullable: true,
      annotations: ["Id", "GeneratedValue"],
    },
    { name: "email", type: "String", nullable: false, annotations: ["Column"] },
    { name: "age", type: "Integer", nullable: true, annotations: [] },
  ],
};

describe("generateZodSchema", () => {
  it("generates correct Zod schema for User entity", () => {
    const result = generateZodSchema(userEntity);

    expect(result).toContain('import { z } from "zod"');
    expect(result).toContain("export const UserSchema = z.object({");
    expect(result).toContain("id: z.number().optional(),");
    expect(result).toContain("email: z.string(),");
    expect(result).toContain("age: z.number().optional(),");
    expect(result).toContain("export type User = z.infer<typeof UserSchema>");
  });

  it("marks non-nullable fields as required", () => {
    const entity: ParseResult = {
      className: "Product",
      isEntity: true,
      fields: [
        {
          name: "name",
          type: "String",
          nullable: false,
          annotations: ["Column"],
        },
        {
          name: "price",
          type: "Double",
          nullable: false,
          annotations: ["Column"],
        },
      ],
    };

    const result = generateZodSchema(entity);
    expect(result).toContain("name: z.string(),");
    expect(result).toContain("price: z.number(),");
    expect(result).not.toContain(".optional()");
  });

  it("handles unknown types with z.unknown()", () => {
    const entity: ParseResult = {
      className: "Custom",
      isEntity: true,
      fields: [
        {
          name: "data",
          type: "SomeCustomType",
          nullable: false,
          annotations: [],
        },
      ],
    };

    const result = generateZodSchema(entity);
    expect(result).toContain("data: z.unknown(),");
  });
});
