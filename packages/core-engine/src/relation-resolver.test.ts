import { describe, it, expect } from "vitest";
import { resolveRelations, getDirectivesForClass } from "./relation-resolver";
import type { ProjectParseResponse } from "./types";

const BASE_FIELD = { annotations: [], isTransient: false, nullable: true };

const PROJECT: ProjectParseResponse = {
  enums: [],
  classes: [
    {
      className: "User",
      packageName: "com.example.app.user",
      stereotype: "entity",
      isEntity: true,
      fields: [
        { ...BASE_FIELD, name: "id", type: "Long", nullable: true },
        { ...BASE_FIELD, name: "email", type: "String", nullable: false },
        {
          ...BASE_FIELD,
          name: "orders",
          type: "List<Order>",
          relation: {
            type: "OneToMany",
            targetClass: "Order",
            mappedBy: "user",
            fieldName: "orders",
            isOwning: false, // OneToMany non-owning
          },
        },
      ],
    },
    {
      className: "Order",
      packageName: "com.example.app.order",
      stereotype: "entity",
      isEntity: true,
      fields: [
        { ...BASE_FIELD, name: "id", type: "Long", nullable: true },
        {
          ...BASE_FIELD,
          name: "user",
          type: "User",
          relation: {
            type: "ManyToOne",
            targetClass: "User",
            fieldName: "user",
            isOwning: true, // ManyToOne always owning
          },
        },
      ],
    },
    {
      className: "Product",
      packageName: "com.example.app.product",
      stereotype: "entity",
      isEntity: true,
      fields: [
        { ...BASE_FIELD, name: "id", type: "Long", nullable: true },
        {
          ...BASE_FIELD,
          name: "tags",
          type: "List<Tag>",
          relation: {
            type: "ManyToMany",
            targetClass: "Tag",
            fieldName: "tags",
            isOwning: true, // no mappedBy = owning side
          },
        },
      ],
    },
    {
      className: "Tag",
      packageName: "com.example.app.tag",
      stereotype: "entity",
      isEntity: true,
      fields: [
        { ...BASE_FIELD, name: "id", type: "Long", nullable: true },
        {
          ...BASE_FIELD,
          name: "products",
          type: "List<Product>",
          relation: {
            type: "ManyToMany",
            targetClass: "Product",
            mappedBy: "tags",
            fieldName: "products",
            isOwning: false,
          },
        },
      ],
    },
  ],
};

describe("resolveRelations", () => {
  it("only emits directives for owning side", () => {
    const directives = resolveRelations(PROJECT);
    // OneToMany(User→orders) is non-owning → no directive
    // ManyToOne(Order→user) is owning → directive
    // ManyToMany(Product→tags) is owning → directive
    // ManyToMany(Tag→products) is non-owning → no directive
    expect(directives).toHaveLength(2);
  });

  it("emits correct directive for ManyToOne", () => {
    const directives = resolveRelations(PROJECT);
    const d = directives.find((d) => d.ownerClass === "Order")!;
    expect(d).toBeDefined();
    expect(d.ownerField).toBe("user");
    expect(d.targetClass).toBe("User");
    expect(d.relationType).toBe("ManyToOne");
    expect(d.foreignKeyField).toBe("userId");
  });

  it("emits correct directive for ManyToMany owning side", () => {
    const directives = resolveRelations(PROJECT);
    const d = directives.find((d) => d.ownerClass === "Product")!;
    expect(d).toBeDefined();
    expect(d.ownerField).toBe("tags");
    expect(d.targetClass).toBe("Tag");
    expect(d.relationType).toBe("ManyToMany");
    expect(d.foreignKeyField).toBe("tagId");
  });

  it("getDirectivesForClass returns directives for owner or target", () => {
    const directives = resolveRelations(PROJECT);
    const forUser = getDirectivesForClass(directives, "User");
    // Order→User is a directive where targetClass=User
    expect(forUser).toHaveLength(1);
    expect(forUser[0].ownerClass).toBe("Order");
  });

  it("returns empty array when no relations exist", () => {
    const response: ProjectParseResponse = {
      enums: [],
      classes: [
        {
          className: "Simple",
          packageName: "com.example",
          stereotype: "entity",
          isEntity: true,
          fields: [{ ...BASE_FIELD, name: "id", type: "Long" }],
        },
      ],
    };
    expect(resolveRelations(response)).toHaveLength(0);
  });
});
