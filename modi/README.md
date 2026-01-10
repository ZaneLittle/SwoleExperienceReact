# Modi (Móði)

Backend API for the Magni application built with Go and Gin.

## Architecture

See [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) for detailed architecture documentation.

## Project Structure

```
modi/
├── cmd/
│   └── api/                 # Application entry point
├── internal/
│   ├── config/              # Configuration management
│   ├── handlers/            # HTTP handlers (Gin routes)
│   │   └── test/            # Handler tests
│   ├── middleware/          # Middleware (auth, JWT, password, logging, rate limiting)
│   ├── models/              # Domain models
│   ├── repositories/        # Data access layer
│   └── services/            # Business logic
├── migrations/              # SQL migrations
├── pkg/                     # Public packages (if any)
├── go.mod                   # Go module definition
├── go.sum                   # Go module checksums
└── .env.example             # Environment variable template
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
   
   **Method 1: Using go install** (requires internet access):
   ```bash
   go install github.com/air-verse/air@latest
   ```
   
   **Method 2: Using install script** (requires internet access):
   ```bash
   curl -sSfL https://raw.githubusercontent.com/air-verse/air/master/install.sh | sh -s -- -b $(go env GOPATH)/bin
   ```
   
   **Method 3: Manual binary download** (if Methods 1-2 fail due to network issues):
   ```bash
   # Download the latest release binary for Linux
   wget https://github.com/air-verse/air/releases/latest/download/air_linux_amd64 -O $(go env GOPATH)/bin/air
   chmod +x $(go env GOPATH)/bin/air
   ```
   
   **Note:** If you can't install Air, `make start` will automatically fall back to `go run` (no hot reload, but still works). Hot reload is convenient but not required.
   
   **Troubleshooting network issues:**
   - If you get "Could not resolve host: github.com", check your DNS settings or network connection
   - Try using a VPN or different network if GitHub is blocked
   - You can skip Air installation and use `make start` - it will work without hot reload

   **Install golangci-lint** (required for linting):
   ```bash
   curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin latest
   ```
   
   **Important**: Make sure `$(go env GOPATH)/bin` is in your PATH. Add this to your `~/.bashrc` or `~/.zshrc`:
   ```bash
   export PATH="$PATH:$(go env GOPATH)/bin"
   ```
   
   Then reload your shell:
   ```bash
   source ~/.bashrc  # or source ~/.zshrc
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
   
   # Install Docker Compose (required for running services)
   # Option 1: Download binary (recommended, fastest)
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Option 2: Install via pip (alternative)
   # sudo dnf install python3-pip
   # sudo pip3 install docker-compose
   
   # Verify docker-compose is installed
   docker-compose --version
   
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

4. Start all services for development:
   
   **Recommended: One command to start everything:**
   ```bash
   make start
   ```
   This command will:
   - Start PostgreSQL and Redis containers using docker-compose
   - Wait for services to be ready
   - Start the API server with hot reload (using Air if installed, or `go run` as fallback)
   
   The API will be available at `http://localhost:8080`
   
   **Alternative: Start services and server separately:**
   ```bash
   # Start PostgreSQL and Redis containers
   make services-start
   
   # Then run the API server (choose one):
   make dev    # With hot reload (requires Air)
   make run    # Standard run (no hot reload)
   ```
   
   **Other useful commands:**
   ```bash
   # Stop services
   make services-stop
   
   # Restart services
   make services-restart
   
   # Create database manually (if needed)
   make db-create
   ```
   
   Test the health check:
   ```bash
   curl http://localhost:8080/health
   ```

## Development

### Starting the Development Environment

**Quick start (recommended):**
```bash
make start
```
This starts all required services (PostgreSQL, Redis, and the API server) in one command.

### Available Make Commands

**Service Management:**
```bash
make start              # Start all services (containers + API server)
make services-start     # Start only PostgreSQL and Redis containers
make services-stop      # Stop PostgreSQL and Redis containers
make services-restart   # Restart PostgreSQL and Redis containers
make db-create          # Create database manually (if needed)
```

**Running the API Server:**
```bash
make dev                # Run with hot reload (requires Air)
make run                # Standard run (no hot reload)
make build              # Build the application
```

**Testing:**
```bash
make test               # Run all tests
make test-unit          # Run unit tests only
make test-integration   # Run integration tests
make test-coverage      # Run tests with coverage report
make lint               # Run linter
```

**Setup:**
```bash
make setup              # Install dependencies and setup development environment
make test-deps          # Install test dependencies only
make clean              # Clean build artifacts
```

See [TEST_STRATEGY.md](TEST_STRATEGY.md) for detailed testing documentation.
