.PHONY: dev test build stop clean build-cli install-cli

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

# Build CLI (requires parser JAR built first)
build-cli: build-parser build-engine
	cp packages/parser-java/target/parser-java-*.jar packages/cli/bin/parser-java.jar
	cd packages/cli && npx tsc

# Install CLI globally from local build
install-cli: build-cli
	cd packages/cli && npm link

# Clean everything
clean:
	docker compose down -v
	cd packages/parser-java && mvn clean -q 2>/dev/null || true
	rm -rf packages/core-engine/dist apps/api/dist apps/web/.next
