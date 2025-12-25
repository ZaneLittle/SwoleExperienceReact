.PHONY: test test-unit test-integration test-coverage lint build clean run dev services-start services-stop services-restart db-create

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

# Start PostgreSQL and Redis containers
services-start:
	@echo "Starting PostgreSQL and Redis containers..."
	@if docker ps -a --format '{{.Names}}' | grep -q '^postgres$$'; then \
		echo "Starting existing PostgreSQL container..."; \
		docker start postgres 2>/dev/null || true; \
	else \
		echo "Creating and starting new PostgreSQL container..."; \
		docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=modi -p 5432:5432 -d postgres:18-alpine; \
	fi
	@if docker ps -a --format '{{.Names}}' | grep -q '^redis$$'; then \
		echo "Starting existing Redis container..."; \
		docker start redis 2>/dev/null || true; \
	else \
		echo "Creating and starting new Redis container..."; \
		docker run --name redis -p 6379:6379 -d redis:8-alpine; \
	fi
	@echo "Verifying containers are running..."
	@docker ps --filter "name=postgres" --filter "name=redis" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Stop PostgreSQL and Redis containers
services-stop:
	@echo "Stopping PostgreSQL and Redis containers..."
	@docker stop postgres redis 2>/dev/null || true
	@echo "Containers stopped."

# Restart PostgreSQL and Redis containers
services-restart: services-stop services-start

# Create database (if needed)
db-create:
	@echo "Creating database 'modi' if it doesn't exist..."
	@docker exec -i postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='modi'" | grep -q 1 || \
		docker exec -i postgres psql -U postgres -c "CREATE DATABASE modi;"
	@echo "Database 'modi' is ready."

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

