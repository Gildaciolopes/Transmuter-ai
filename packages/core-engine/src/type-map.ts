/** Maps Java types to Zod validators */
export const javaToZod: Record<string, string> = {
  String: "z.string()",
  Long: "z.number()",
  long: "z.number()",
  Integer: "z.number()",
  int: "z.number()",
  Double: "z.number()",
  double: "z.number()",
  Float: "z.number()",
  float: "z.number()",
  Boolean: "z.boolean()",
  boolean: "z.boolean()",
  BigDecimal: "z.number()",
  LocalDate: "z.string()",
  LocalDateTime: "z.string()",
  Date: "z.date()",
  UUID: "z.string().uuid()",
};

/** Maps Java types to Prisma types */
export const javaToPrisma: Record<string, string> = {
  String: "String",
  Long: "BigInt",
  long: "BigInt",
  Integer: "Int",
  int: "Int",
  Double: "Float",
  double: "Float",
  Float: "Float",
  float: "Float",
  Boolean: "Boolean",
  boolean: "Boolean",
  BigDecimal: "Decimal",
  LocalDate: "DateTime",
  LocalDateTime: "DateTime",
  Date: "DateTime",
  UUID: "String",
};
