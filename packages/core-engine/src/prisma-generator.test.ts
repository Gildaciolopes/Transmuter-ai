import { describe, it, expect } from "vitest";
import { generatePrismaModel } from "./prisma-generator";
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

describe("generatePrismaModel", () => {
  it("generates correct Prisma model for User entity", () => {
    const result = generatePrismaModel(userEntity);

    expect(result).toContain("model User {");
    expect(result).toMatch(/id\s+BigInt\s+@id\s+@default\(autoincrement\(\)\)/);
    expect(result).toMatch(/email\s+String/);
    expect(result).toMatch(/age\s+Int\?/);
    expect(result).toContain("}");
  });

  it("does not mark @Id fields as nullable", () => {
    const result = generatePrismaModel(userEntity);
    // id should be BigInt, not BigInt?
    expect(result).not.toMatch(/id\s+BigInt\?/);
  });

  it("marks nullable fields with ?", () => {
    const entity: ParseResult = {
      className: "Product",
      isEntity: true,
      fields: [
        {
          name: "description",
          type: "String",
          nullable: true,
          annotations: [],
        },
      ],
    };

    const result = generatePrismaModel(entity);
    expect(result).toMatch(/description\s+String\?/);
  });

  it("maps Java types to Prisma types correctly", () => {
    const entity: ParseResult = {
      className: "Record",
      isEntity: true,
      fields: [
        {
          name: "flag",
          type: "Boolean",
          nullable: false,
          annotations: ["Column"],
        },
        {
          name: "amount",
          type: "BigDecimal",
          nullable: false,
          annotations: ["Column"],
        },
        {
          name: "createdAt",
          type: "LocalDateTime",
          nullable: false,
          annotations: ["Column"],
        },
      ],
    };

    const result = generatePrismaModel(entity);
    expect(result).toMatch(/flag\s+Boolean/);
    expect(result).toMatch(/amount\s+Decimal/);
    expect(result).toMatch(/createdAt\s+DateTime/);
  });
});
