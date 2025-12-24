# Modi (Móði)

Backend API for the Magni application built with Go and Gin.

## Architecture

See [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) for detailed architecture documentation.

## Project Structure

```
modi/
├── cmd/
│   └── api/
│       └── main.go          # Application entry point
├── internal/
│   ├── config/              # Configuration management
│   ├── handlers/            # HTTP handlers (Gin routes)
│   ├── middleware/          # Middleware (auth, logging, etc.)
│   ├── models/              # Domain models
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── migrations/              # SQL migrations
├── pkg/                     # Public packages (if any)
├── go.mod
├── go.sum
└── .env.example
```

## Prerequisites

For local development, you'll need:

- **Go** 1.24 or later
  - Download from [golang.org](https://golang.org/dl/)
  - Verify installation: `go version`

- **PostgreSQL** 18 or later
  - Required for data persistence
  - Will be run in Docker (see Setup section)

- **Redis** 8.0 or later
  - Required for caching and session management
  - Will be run in Docker (see Setup section)

- **Docker**
  - Required for running PostgreSQL and Redis locally
  - Download from [docker.com](https://www.docker.com/get-started)
  
## Setup

1. Install dependencies:
   ```bash
   go mod download
   ```
   
   **Optional: Install Air for hot reload** (recommended for development):
   ```bash
   go install github.com/air-verse/air@latest
   ```
   Or using the install script:
   ```bash
   curl -sSfL https://raw.githubusercontent.com/air-verse/air/master/install.sh | sh -s -- -b $(go env GOPATH)/bin
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure the following:

   **DATABASE_URL**
   - For local Docker PostgreSQL:
     ```bash
     DATABASE_URL=postgres://postgres:password@localhost:5432/modi?sslmode=disable
     ```
     - Username: `postgres` (default)
     - Password: The password you set when starting PostgreSQL (default: `password`)
     - Database: `modi` (will be created automatically when starting the container)

   **REDIS_URL**
   - For local Docker Redis:
     ```bash
     REDIS_URL=redis://localhost:6379
     ```

   **JWT_SECRET**
   - Required: A strong, random secret key for signing JWT tokens
   - Generate a secure secret (recommended length: 32+ characters):
     ```bash
     # Using OpenSSL (recommended)
     openssl rand -hex 32
     
     # Or using Python
     python3 -c "import secrets; print(secrets.token_hex(32))"
     
     # Or using Node.js
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. **Docker Setup:**
   
   **Fedora/RHEL Setup:**
   ```bash
   # Install Docker (if not already installed)
   sudo dnf install docker
   
   # Start Docker service
   sudo systemctl start docker
   sudo systemctl enable docker  # Enable on boot
   
   # Add your user to docker group (to run without sudo)
   sudo usermod -aG docker $USER
   
   # IMPORTANT: Apply the group change (choose one):
   # Option 1: Log out and log back in
   # Option 2: Start a new shell session with the new group
   newgrp docker
   
   # Verify you're in the docker group
   groups
   # You should see 'docker' in the output
   
   # Test Docker works without sudo
   docker ps
   ```
   
   **Troubleshooting Docker Permission Issues:**
   
   **Error: `permission denied while trying to connect to the docker API`**
   
   This means Docker is running but your user doesn't have permission. Fix it:
   ```bash
   # Add yourself to docker group (if not already done)
   sudo usermod -aG docker $USER
   
   # Apply the group change immediately
   newgrp docker
   ```

5. Start PostgreSQL and Redis:
   ```bash
   # Start PostgreSQL container
   # The database 'modi' will be created automatically
   docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=modi -p 5432:5432 -d postgres:18-alpine
   
   # Start Redis container
   docker run --name redis -p 6379:6379 -d redis:8-alpine
   
   # Verify they're running
   docker ps
   ```
   
   **If containers already exist:**
   ```bash
   # Just start existing containers
   docker start postgres redis
   ```
   
   **If you need to recreate the database:**
   ```bash
   # Connect to PostgreSQL and create the database (if not created automatically)
   docker exec -it postgres psql -U postgres -c "CREATE DATABASE modi;"
   ```

6. Run the application:
   
   **Option 1: With hot reload (recommended for development):**
   ```bash
   air
   ```
   Air will automatically rebuild and restart the server when you make code changes.
   
   **Option 2: Standard run:**
   ```bash
   go run cmd/api/main.go
   ```

   The API will be available at `http://localhost:8080`
   
   Test the health check:
   ```bash
   curl http://localhost:8080/health
   ```


