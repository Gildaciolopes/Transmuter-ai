/** Maps Java types to Zod validators */
export const javaToZod: Record<string, string> = {
  // Primitives
  String: 'z.string()',
  Long: 'z.number()',
  long: 'z.number()',
  Integer: 'z.number()',
  int: 'z.number()',
  Double: 'z.number()',
  double: 'z.number()',
  Float: 'z.number()',
  float: 'z.number()',
  Boolean: 'z.boolean()',
  boolean: 'z.boolean()',
  short: 'z.number().int()',
  Short: 'z.number().int()',
  // Big types
  BigDecimal: 'z.number()',
  BigInteger: 'z.bigint()',
  // Dates
  LocalDate: 'z.string()',
  LocalDateTime: 'z.string()',
  ZonedDateTime: 'z.string().datetime()',
  OffsetDateTime: 'z.string().datetime()',
  Instant: 'z.string().datetime()',
  Date: 'z.date()',
  // Identifiers
  UUID: 'z.string().uuid()',
  // Characters
  char: 'z.string().length(1)',
  Character: 'z.string().length(1)',
  // Binary
  'byte[]': 'z.string()',
  Blob: 'z.string()',
  // Collections / maps
  'Map<String,String>': 'z.record(z.string())',
  Map: 'z.record(z.unknown())',
  Object: 'z.unknown()',
  JsonNode: 'z.unknown()',
};

/** Maps Java types to Prisma types */
export const javaToPrisma: Record<string, string> = {
  // Primitives
  String: 'String',
  Long: 'BigInt',
  long: 'BigInt',
  Integer: 'Int',
  int: 'Int',
  Double: 'Float',
  double: 'Float',
  Float: 'Float',
  float: 'Float',
  Boolean: 'Boolean',
  boolean: 'Boolean',
  short: 'Int',
  Short: 'Int',
  // Big types
  BigDecimal: 'Decimal',
  BigInteger: 'BigInt',
  // Dates
  LocalDate: 'DateTime',
  LocalDateTime: 'DateTime',
  ZonedDateTime: 'DateTime',
  OffsetDateTime: 'DateTime',
  Instant: 'DateTime',
  Date: 'DateTime',
  // Identifiers
  UUID: 'String',
  // Characters
  char: 'String',
  Character: 'String',
  // Binary
  'byte[]': 'Bytes',
  Blob: 'Bytes',
  // Collections / maps
  Map: 'Json',
  Object: 'Json',
  JsonNode: 'Json',
};

/** Maps Java types to TypeScript types (for DTO interfaces) */
export const javaToTs: Record<string, string> = {
  String: 'string',
  Long: 'number',
  long: 'number',
  Integer: 'number',
  int: 'number',
  Double: 'number',
  double: 'number',
  Float: 'number',
  float: 'number',
  Boolean: 'boolean',
  boolean: 'boolean',
  short: 'number',
  Short: 'number',
  BigDecimal: 'number',
  BigInteger: 'bigint',
  LocalDate: 'string',
  LocalDateTime: 'string',
  ZonedDateTime: 'string',
  OffsetDateTime: 'string',
  Instant: 'string',
  Date: 'Date',
  UUID: 'string',
  char: 'string',
  Character: 'string',
  'byte[]': 'string',
  Blob: 'string',
  Map: 'Record<string, unknown>',
  Object: 'unknown',
  JsonNode: 'unknown',
};
