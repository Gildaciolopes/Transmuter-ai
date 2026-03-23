.PHONY: dev test build stop clean

# Start all services
dev:
	docker compose up --build

# Start in background
dev-bg:
	docker compose up --build -d

# Run unit tests (core-engine)
test:
	cd packages/core-engine && npx vitest run

# Build Java parser JAR locally
build-parser:
	cd packages/parser-java && mvn package -q

# Build core-engine
build-engine:
	cd packages/core-engine && npx tsc

# Stop all services
stop:
	docker compose down

# Clean everything
clean:
	docker compose down -v
	cd packages/parser-java && mvn clean -q 2>/dev/null || true
	rm -rf packages/core-engine/dist apps/api/dist apps/web/.next
