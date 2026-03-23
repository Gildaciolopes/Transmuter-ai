# Transmuter.ai

Migration engine that converts Java Spring Boot entities to TypeScript (Zod schemas + Prisma models) using deterministic AST analysis.

## Quick Start (3 steps)

### 1. Start all services

```bash
make dev
```

This builds and starts: PostgreSQL, Redis, Java Parser (port 4000), NestJS API (port 3000), Next.js UI (port 3001).

### 2. Open the UI

Go to [http://localhost:3001](http://localhost:3001) — paste any Java `@Entity` class and click **Convert**.

### 3. Or use the API directly

```bash
curl -X POST http://localhost:3000/convert/simple \
  -H "Content-Type: application/json" \
  -d '{
    "code": "@Entity\npublic class User {\n  @Id\n  @GeneratedValue\n  private Long id;\n\n  @Column(nullable = false)\n  private String email;\n\n  private Integer age;\n}"
  }'
```

## Running Tests

```bash
make test
```

## Project Structure

```
transmuter-ai/
├── apps/
│   ├── api/                # NestJS orchestrator (POST /convert/simple)
│   └── web/                # Next.js dashboard (textarea + output)
├── packages/
│   ├── parser-java/        # Java AST parser (Javalin + JavaParser)
│   └── core-engine/        # TS conversion logic (Zod + Prisma generators)
├── docker/                 # Dockerfiles
├── samples/                # Sample Java entities for testing
├── docker-compose.yml
└── Makefile
```

## How It Works

1. **Java Parser** (port 4000) receives Java source code, uses JavaParser to extract `@Entity` classes with field metadata (types, annotations, nullability).
2. **Core Engine** maps the parsed AST to Zod schemas and Prisma models using deterministic type-mapping rules.
3. **API** (port 3000) orchestrates the pipeline: receives Java code → calls parser → runs converters → returns results.
4. **Web UI** (port 3001) provides a simple interface to paste Java code and view generated output.

## Type Mappings

| Java Type       | Zod              | Prisma    |
|----------------|------------------|-----------|
| String         | z.string()       | String    |
| Long           | z.number()       | BigInt    |
| Integer        | z.number()       | Int       |
| Double/Float   | z.number()       | Float     |
| Boolean        | z.boolean()      | Boolean   |
| BigDecimal     | z.number()       | Decimal   |
| LocalDateTime  | z.string()       | DateTime  |
| UUID           | z.string().uuid()| String    |

## Development (without Docker)

```bash
# Terminal 1: Start parser
cd packages/parser-java && mvn package -q && java -jar target/parser-java-0.1.0.jar

# Terminal 2: Start API
cd apps/api && npx nest start --watch

# Terminal 3: Start web
cd apps/web && npx next dev
```
