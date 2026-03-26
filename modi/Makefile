.PHONY: test test-unit test-integration test-coverage lint build clean run dev start services-start services-stop services-restart db-create check-docker-compose

# Docker Compose command detection is done inline in each target
# This supports both 'docker-compose' (standalone) and 'docker compose' (plugin)

# Run all tests
test:
	go test -v ./...

# Run unit tests only
test-unit:
	go test -v -short ./internal/...

# Run integration tests only
test-integration:
	go test -v -tags=integration ./integration/...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -html=coverage.out -o coverage.html

# Run linter
lint:
	golangci-lint run ./...

# Build the application
build:
	go build -o bin/api ./cmd/api

# Clean build artifacts
clean:
	rm -rf bin/ coverage.out coverage.html

# Run tests in watch mode (requires air)
test-watch:
	air test

# Install test dependencies
test-deps:
	go get github.com/stretchr/testify@latest
	go get github.com/pashagolub/pgxmock/v5@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Setup development environment
setup: test-deps
	go mod download
	go mod tidy

# Start all required services for local development
start:
	@echo "Starting all services for local development..."
	@echo ""
	@echo "Step 1: Starting PostgreSQL and Redis containers..."
	@DOCKER_COMPOSE_CMD=$$(command -v docker-compose 2>/dev/null); \
	if [ -z "$$DOCKER_COMPOSE_CMD" ]; then \
		if docker compose version >/dev/null 2>&1; then \
			DOCKER_COMPOSE_CMD="docker compose"; \
		else \
			echo "Error: Docker Compose not found."; \
			echo ""; \
			echo "Install with one of these methods:"; \
			echo "  1. Download binary (recommended):"; \
			echo "     sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$$(uname -s)-$$(uname -m)\" -o /usr/local/bin/docker-compose"; \
			echo "     sudo chmod +x /usr/local/bin/docker-compose"; \
			echo ""; \
			echo "  2. Install via pip:"; \
			echo "     sudo dnf install python3-pip"; \
			echo "     sudo pip3 install docker-compose"; \
			echo ""; \
			exit 1; \
		fi; \
	fi; \
	$$DOCKER_COMPOSE_CMD up -d postgres redis
	@echo ""
	@echo "Step 2: Waiting for services to be ready..."
	@echo -n "Waiting for PostgreSQL"
	@DOCKER_COMPOSE_CMD=$$(command -v docker-compose 2>/dev/null); \
	if [ -z "$$DOCKER_COMPOSE_CMD" ]; then DOCKER_COMPOSE_CMD="docker compose"; fi; \
	timeout=60; \
	while [ $$timeout -gt 0 ]; do \
		if $$DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then \
			echo ""; \
			echo "PostgreSQL is ready!"; \
			break; \
		fi; \
		echo -n "."; \
		sleep 1; \
		timeout=$$((timeout-1)); \
	done; \
	if [ $$timeout -eq 0 ]; then \
		echo ""; \
		echo "Warning: PostgreSQL health check timed out, but continuing..."; \
	fi
	@echo -n "Waiting for Redis"
	@timeout=60; \
	while [ $$timeout -gt 0 ]; do \
		DOCKER_COMPOSE_CMD=$$(command -v docker-compose 2>/dev/null); \
		if [ -z "$$DOCKER_COMPOSE_CMD" ]; then DOCKER_COMPOSE_CMD="docker compose"; fi; \
		if $$DOCKER_COMPOSE_CMD exec -T redis redis-cli ping >/dev/null 2>&1; then \
			echo ""; \
			echo "Redis is ready!"; \
			break; \
		fi; \
		echo -n "."; \
		sleep 1; \
		timeout=$$((timeout-1)); \
	done; \
	if [ $$timeout -eq 0 ]; then \
		echo ""; \
		echo "Warning: Redis health check timed out, but continuing..."; \
	fi
	@echo ""
	@echo "Step 3: Starting API server with hot reload..."
	@echo ""
	@if ! command -v air >/dev/null 2>&1; then \
		echo "Warning: Air is not installed. Install it with: go install github.com/air-verse/air@latest"; \
		echo "Falling back to standard 'go run' (no hot reload)..."; \
		echo ""; \
		go run cmd/api/main.go; \
	else \
		air; \
	fi

# Start PostgreSQL and Redis containers
services-start:
	@echo "Starting PostgreSQL and Redis containers..."
	@DOCKER_COMPOSE_CMD=$$(command -v docker-compose 2>/dev/null); \
	if [ -z "$$DOCKER_COMPOSE_CMD" ]; then \
		if docker compose version >/dev/null 2>&1; then \
			DOCKER_COMPOSE_CMD="docker compose"; \
		else \
			echo "Error: Docker Compose not found."; \
			echo "Install with one of:"; \
			echo "  sudo dnf install python3-pip && sudo pip3 install docker-compose"; \
			echo "  OR: sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$$(uname -s)-$$(uname -m)\" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"; \
			exit 1; \
		fi; \
	fi; \
	$$DOCKER_COMPOSE_CMD up -d postgres redis
	@echo "Services started. Use 'make start' to start services and the API server together."

# Stop PostgreSQL and Redis containers
services-stop:
	@echo "Stopping PostgreSQL and Redis containers..."
	@DOCKER_COMPOSE_CMD=$$(command -v docker-compose 2>/dev/null || echo "docker compose"); \
	$$DOCKER_COMPOSE_CMD stop postgres redis
	@echo "Containers stopped."

# Restart PostgreSQL and Redis containers
services-restart: services-stop services-start

# Create database (if needed)
db-create:
	@echo "Creating database 'modi' if it doesn't exist..."
	@DOCKER_COMPOSE_CMD=$$(command -v docker-compose 2>/dev/null); \
	if [ -z "$$DOCKER_COMPOSE_CMD" ]; then DOCKER_COMPOSE_CMD="docker compose"; fi; \
	$$DOCKER_COMPOSE_CMD exec -T postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='modi'" | grep -q 1 || \
		$$DOCKER_COMPOSE_CMD exec -T postgres psql -U postgres -c "CREATE DATABASE modi;"
	@echo "Database 'modi' is ready."

# Create database schema (run migrations)
db-migrate:
	@echo "Running database migrations..."
	@./scripts/create-schema.sh

# Run the application (standard)
run:
	go run cmd/api/main.go

# Run the application with hot reload (Air)
dev:
	@if ! command -v air >/dev/null 2>&1; then \
		echo "Error: Air is not installed. Install it with: go install github.com/air-verse/air@latest"; \
		exit 1; \
	fi
	air

