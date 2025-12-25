# Backend Architecture - Modi (Móði)

## Overview

This document outlines the architectural strategy for **Modi (Móði)** - the backend API for the Magni application, using:
- **Go** with **Gin** framework for the API server
- **PostgreSQL** for persistent data storage
- **Redis** for caching and session management
- **Python FastAPI** microservice for future ML/OCR capabilities

The architecture is designed to support:
- User authentication and cross-device data synchronization
- GDPR-compliant data storage and management
- Macro tracking with shared food database
- Future machine vision capabilities for nutrition label scanning
- Self-hosted deployment on TrueNAS Scale
- Access via Cloudflare Tunnel

## Project Structure

```
bhw/
├── modi/              # Backend API (Go + Gin)
│   ├── cmd/
│   ├── src/
│   ├── migrations/
│   └── ...
└── web/               # Frontend (Magni - React Native/Expo)
    ├── app/
    ├── components/
    └── ...
```

## Current State

The application currently uses:
- **Frontend (Magni)**: React Native/Expo with web support
- **Backend (Modi)**: Planned - Go + Gin API server
- **Storage**: AsyncStorage (local device storage only)
- **Data Models**: Workouts (with days, sets, reps, weights) and Weight entries

## Architecture Requirements

### 1. User Authentication & Authorization
- Secure user registration and login
- JWT-based authentication for API access
- Password hashing (bcrypt/argon2)
- Session management with Redis
- Multi-device support with sync capabilities

### 2. Data Synchronization
- Conflict resolution for multi-device edits
- Incremental sync (only changed data)
- Offline-first support with sync queue
- Timestamp-based versioning

### 3. GDPR Compliance
- User data export functionality
- Right to deletion (data erasure)
- Consent management
- Data minimization principles
- Privacy policy and terms of service tracking
- Audit logging for data access/modifications
- Data retention policies

### 4. Macro Tracking Features
- Food database (shared across users)
- User-contributed foods with moderation
- Food search and discovery
- Daily macro tracking
- Meal logging
- Food favorites

### 5. Machine Vision (Future)
- Image upload and storage
- OCR/ML processing pipeline
- Nutrition facts extraction
- Food database population from images

### 6. Infrastructure
- Self-hosted on TrueNAS Scale
- Cloudflare Tunnel for secure access
- Containerized deployment (Docker)
- Scalable architecture

---

## Technology Stack

### Backend: Go + Gin

**Why Go?**
- Fast compilation and execution
- Excellent concurrency with goroutines (perfect for sync operations)
- Single binary deployment (easy Docker)
- Low memory footprint
- Strong typing without verbosity
- Great for API services

**Why Gin?**
- Most popular Go web framework (~75k stars)
- Mature and battle-tested
- Excellent documentation and community
- Great middleware ecosystem
- Simple API, easy to learn
- Built on standard `net/http` (compatible with all Go packages)
- Good performance (~50k-60k req/s)

**Key Libraries:**
- **Gin**: `github.com/gin-gonic/gin` - Web framework
- **pgx**: `github.com/jackc/pgx/v5` - PostgreSQL driver
- **Redis**: `github.com/redis/go-redis/v9` - Redis client
- **JWT**: `github.com/golang-jwt/jwt/v5` - JWT tokens
- **bcrypt**: `golang.org/x/crypto/bcrypt` - Password hashing
- **validator**: `github.com/go-playground/validator/v10` - Input validation

### Database: PostgreSQL

**Why PostgreSQL?**
- Robust relational database with ACID guarantees
- Excellent JSON support for flexible schemas
- Full-text search capabilities (perfect for food search)
- Strong performance for complex queries
- Well-supported on TrueNAS Scale
- Excellent Go support with pgx

**Key Features Used:**
- JSONB columns for flexible data (extracted nutrition data)
- Full-text search (GIN indexes) for food search
- Transactions for data consistency
- Foreign keys for referential integrity
- Soft deletes for GDPR compliance

### Cache: Redis

**Why Redis?**
- Fast in-memory data store
- Perfect for session storage
- Rate limiting implementation
- Caching frequently accessed data (food search results, popular foods)
- Pub/Sub for future real-time features
- Low latency

**Use Cases:**
- JWT refresh token storage
- Session management
- Rate limiting counters
- Food search result caching
- Popular foods cache
- Sync conflict resolution locks

### ML Service: Python FastAPI (Future)

**Why Separate Service?**
- Python has the best ML/OCR libraries (Tesseract, OpenCV, PyTorch)
- Isolates ML processing from main API (different resource needs)
- Can scale independently
- Different deployment requirements (GPU support, etc.)

**Communication:**
- REST API calls from Go backend
- Async processing with status polling
- Message queue option (Redis/RabbitMQ) for high volume

---

## System Architecture

### High-Level Component Diagram

```
                    ┌─────────────────────┐
                    │ Cloudflare Tunnel   │
                    │  (Secure Access)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Nginx Reverse      │
                    │      Proxy          │
                    │ (SSL, Routing)      │
                    └──────────┬──────────┘
                               │ HTTP
                    ┌──────────▼──────────┐
                    │                     │
                    │    API Server       │
                    │    (Go + Gin)       │
                    │                     │
                    │  • Authentication   │
                    │  • Business Logic   │
                    │  • Request Handling │
                    │                     │
                    └───┬──────┬──────┬───┘
                        │      │      │
            ┌───────────┘      │      └───────────┐
            │                  │                  │
    ┌───────▼───────┐  ┌───────▼──────┐  ┌───────▼──────┐
    │  PostgreSQL   │  │    Redis     │  │  ML Service  │
    │   Database    │  │    Cache     │  │ (Python/     │
    │               │  │              │  │  FastAPI)    │
    │ • Workouts    │  │ • Sessions   │  │              │
    │ • Weights     │  │ • Rate Limit │  │ • OCR        │
    │ • Foods       │  │ • Cache      │  │ • Image Proc │
    │ • Etc.        │  │              │  │              │
    └───────────────┘  └──────────────┘  └──────────────┘
```

### Request Flow

**Example: Food Search Request**

1. **Client** → Makes request to `/api/v1/foods/search?q=chicken`
2. **Cloudflare Tunnel** → Encrypts and routes to homelab
3. **Nginx** → SSL termination, routes to API server
4. **API Server (Go/Gin)** → Receives request
   - Middleware: Authentication check (validates JWT)
   - Handler: Food search handler
   - Service: Checks Redis cache first
     - **Cache Hit**: Returns cached results
     - **Cache Miss**: Queries PostgreSQL
       - PostgreSQL: Full-text search on foods table
       - Service: Caches results in Redis
       - Service: Returns results
5. **Response** → Back through Nginx → Cloudflare Tunnel → Client

**Key Point:** Nginx only talks to the API server. The API server orchestrates all interactions with Redis and PostgreSQL.

### Data Flow Strategy

#### Read Operations (Optimized Path):
```
Client → Nginx → API Server → Redis (cache check)
  ├─ Cache Hit: Return cached data
  └─ Cache Miss: Query PostgreSQL → Store in Redis → Return data
```

**Example Flow:**
1. Client requests food search
2. API Server checks Redis cache
3. If cached: Return immediately
4. If not cached: Query PostgreSQL → Cache result → Return

#### Write Operations:
```
Client → Nginx → API Server → Validate → PostgreSQL → Invalidate Cache → Return
```

**Example Flow:**
1. Client creates workout
2. API Server validates input
3. API Server writes to PostgreSQL
4. API Server invalidates related cache entries
5. Return success response

#### Sync Operations:
```
Client → Nginx → API Server → Query PostgreSQL (changes since timestamp) → Return delta
Client → Nginx → API Server → Apply changes to PostgreSQL (with conflict resolution) → Return result
```

**Example Flow:**
1. Client requests sync with `last_sync_timestamp`
2. API Server queries PostgreSQL for changes since timestamp
3. API Server returns modified/deleted records
4. Client sends local changes
5. API Server applies to PostgreSQL with conflict detection
6. API Server returns sync result

---

## Architectural Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│         HTTP Handlers (Gin)         │  ← Request/Response handling
├─────────────────────────────────────┤
│         Middleware Layer            │  ← Auth, logging, validation
├─────────────────────────────────────┤
│         Service Layer               │  ← Business logic
├─────────────────────────────────────┤
│         Repository Layer            │  ← Data access abstraction
├─────────────────────────────────────┤
│         Database (PostgreSQL)       │  ← Data persistence
└─────────────────────────────────────┘
```

**Benefits:**
- Clear separation of concerns
- Testable components
- Easy to maintain and extend
- Repository pattern allows database swapping if needed

### 2. Repository Pattern

**Why?**
- Abstracts database implementation
- Makes testing easier (mock repositories)
- Centralizes data access logic
- Easy to add caching layer

**Example Structure:**
```go
type WorkoutRepository interface {
    GetByUserID(userID string, lastSync time.Time) ([]Workout, error)
    Create(workout *Workout) error
    Update(workout *Workout) error
    Delete(id string) error
}

type workoutRepository struct {
    db *pgx.Conn
    cache *redis.Client
}
```

### 3. Service Layer Pattern

**Why?**
- Encapsulates business logic
- Coordinates between repositories
- Handles transactions
- Implements sync conflict resolution

**Example:**
```go
type WorkoutService struct {
    repo WorkoutRepository
    sync SyncService
}

func (s *WorkoutService) SyncWorkouts(userID string, clientChanges []Workout, lastSync time.Time) (SyncResult, error) {
    // 1. Get server changes since lastSync
    // 2. Detect conflicts
    // 3. Resolve conflicts
    // 4. Apply changes
    // 5. Return sync result
}
```

### 4. Sync Strategy

**Optimistic Concurrency Control:**

Each record includes:
- `sync_version` (incrementing integer)
- `updated_at` (timestamp)
- `deleted_at` (soft delete timestamp)

**Sync Flow:**
1. Client sends `last_sync_timestamp`
2. Server queries: `SELECT * FROM workouts WHERE user_id = ? AND updated_at > ?`
3. Server returns:
   - Modified records
   - Deleted record IDs (where `deleted_at IS NOT NULL`)
   - Current server timestamp
4. Client merges changes locally
5. Client sends local changes
6. Server applies with conflict detection:
   - If `client.sync_version < server.sync_version` → Conflict
   - Conflict resolution: Last-write-wins (or manual merge for critical data)

**Conflict Resolution:**
- Simple: Last-write-wins (timestamp-based)
- Advanced: Field-level merging for complex objects
- User choice: Present conflicts to user for resolution

### 6. Error Handling Strategy

**Structured Error Responses:**
```go
type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details interface{} `json:"details,omitempty"`
}
```

**Error Types:**
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409) - for sync conflicts
- Server errors (500)

**Logging:**
- Structured logging with context
- Error tracking with stack traces
- Request ID for tracing

---

## Database Schema Strategy

### Core Tables

#### 1. **users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    consent_date TIMESTAMP,
    privacy_policy_version INTEGER,
    terms_version INTEGER
);
```

#### 2. **workouts**
```sql
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(10,2),
    sets INTEGER,
    reps INTEGER,
    notes TEXT,
    day INTEGER NOT NULL,
    day_order INTEGER NOT NULL,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    last_synced_at TIMESTAMP
);

CREATE INDEX idx_workouts_user_sync ON workouts(user_id, updated_at) WHERE deleted_at IS NULL;
```

#### 3. **weights**
```sql
CREATE TABLE weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight DECIMAL(10,2) NOT NULL,
    date_time TIMESTAMP NOT NULL,
    sync_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    last_synced_at TIMESTAMP
);

CREATE INDEX idx_weights_user_date ON weights(user_id, date_time DESC) WHERE deleted_at IS NULL;
```

#### 4. **foods** (Shared Database)
```sql
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    barcode VARCHAR(255),
    calories DECIMAL(10,2) NOT NULL,
    protein DECIMAL(10,2) NOT NULL,
    carbs DECIMAL(10,2) NOT NULL,
    fat DECIMAL(10,2) NOT NULL,
    created_by_user_id UUID REFERENCES users(id),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_foods_search ON foods USING GIN(to_tsvector('english', name || ' ' || COALESCE(brand, '')));
```

#### 5. **food_logs**
```sql
CREATE TABLE food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id),
    quantity DECIMAL(10,2) NOT NULL,
    meal_type VARCHAR(50),
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, date DESC);
```

#### 6. **audit_logs** (GDPR Compliance)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp DESC);
```

### Database Design Principles

1. **UUIDs for Primary Keys:**
   - Better for distributed systems
   - No sequential ID exposure
   - Easier sync (no ID conflicts)

2. **Soft Deletes:**
   - `deleted_at` timestamp instead of hard delete
   - Required for GDPR (data retention)
   - Enables sync of deletions

3. **Sync Fields:**
   - `sync_version` for conflict detection
   - `updated_at` for incremental sync
   - `last_synced_at` for tracking

4. **Indexes:**
   - User + timestamp indexes for sync queries
   - Full-text search indexes for food search
   - Foreign key indexes for joins

5. **Partitioning (Future):**
   - Partition `food_logs` by date (monthly)
   - Partition `audit_logs` by date (monthly)
   - Improves query performance for large datasets

---

## API Design Strategy

### RESTful API Structure

```
/api/v1/
  /auth
    POST   /register          # User registration
    POST   /login            # User login (returns JWT)
    POST   /refresh          # Refresh JWT token
    POST   /logout           # Logout (invalidate refresh token)
    DELETE /account          # GDPR account deletion
  
  /users
    GET    /me               # Get current user profile
    PUT    /me               # Update user profile
    GET    /me/export        # GDPR data export
  
  /workouts
    GET    /                  # List workouts (with sync params)
    POST   /                  # Create workout
    GET    /:id               # Get workout
    PUT    /:id               # Update workout
    DELETE /:id               # Delete workout (soft delete)
    POST   /sync              # Bulk sync endpoint
  
  /weights
    GET    /                  # List weights (with sync params)
    POST   /                  # Create weight entry
    GET    /:id               # Get weight entry
    PUT    /:id               # Update weight entry
    DELETE /:id               # Delete weight entry
    POST   /sync              # Bulk sync endpoint
  
  /foods
    GET    /search?q=...     # Search foods
    GET    /:id               # Get food details
    POST   /                  # Create user-contributed food
    GET    /popular           # Get popular foods
    GET    /recent            # Get recently added foods
  
  /food-logs
    GET    /                  # List food logs
    POST   /                  # Create food log
    GET    /:id               # Get food log
    PUT    /:id               # Update food log
    DELETE /:id               # Delete food log
    GET    /daily-summary     # Get daily macro summary
  
  /images (Future)
    POST   /upload            # Upload image for processing
    GET    /:id/status        # Get processing status
    GET    /:id/result        # Get extracted data
```

### Request/Response Patterns

**Standard Response Headers:**
```
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Timestamp: 2024-01-01T00:00:00Z
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 99
X-Rate-Limit-Reset: 2024-01-01T00:01:00Z
```

**Standard Success Response Body:**
```json
{
  "data": { ... }
}
```

**Error Response Headers:**
```
HTTP/1.1 400 Bad Request
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Timestamp: 2024-01-01T00:00:00Z
```

**Error Response Body:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

**Sync Response Headers:**
```
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Timestamp: 2024-01-01T00:00:00Z
X-Server-Timestamp: 2024-01-01T00:00:00Z
```

**Sync Response Body:**
```json
{
  "data": {
    "modified": [...],
    "deleted": ["id1", "id2"],
    "conflicts": [...]
  }
}
```

**Response Header Conventions:**
- `X-Request-ID`: Unique request identifier for tracing
- `X-Timestamp`: Server timestamp when response was generated
- `X-Server-Timestamp`: Current server time (for sync operations)
- `X-Rate-Limit-Limit`: Maximum requests allowed in window
- `X-Rate-Limit-Remaining`: Remaining requests in current window
- `X-Rate-Limit-Reset`: Unix timestamp when rate limit resets
- `Content-Type`: Always `application/json` for JSON responses

### Authentication Strategy

**JWT Token Structure:**
- **Access Token**: Short-lived (15 minutes)
  - Contains: user_id, email, roles
  - Stored in memory (client)
- **Refresh Token**: Long-lived (7 days)
  - Stored in Redis (server-side)
  - Used to get new access tokens

**Flow:**
1. User logs in → Returns access + refresh tokens
2. Client uses access token for API calls
3. Access token expires → Client uses refresh token
4. Server validates refresh token (Redis lookup)
5. Server issues new access token
6. Refresh token rotation (new refresh token issued)

---

## Caching Strategy

### Redis Usage Patterns

#### 1. Session Storage
```
Key: session:{refresh_token}
Value: {user_id, expires_at}
TTL: 7 days
```

#### 2. Rate Limiting
```
Key: rate_limit:{user_id}:{endpoint}
Value: request_count
TTL: 1 minute (sliding window)
```

#### 3. Food Search Cache
```
Key: food_search:{query_hash}
Value: [food_ids]
TTL: 15 minutes
```

#### 4. Popular Foods Cache
```
Key: foods:popular
Value: [food_ids]
TTL: 1 hour
```

#### 5. Sync Locks
```
Key: sync_lock:{user_id}
Value: lock_token
TTL: 30 seconds
```

### Cache Invalidation Strategy

**Write-Through:**
- Critical data (user profile) → Update DB + Cache simultaneously

**TTL-Based:**
- Search results → Expire after 15 minutes
- Popular foods → Expire after 1 hour

**Manual Invalidation:**
- On food update → Invalidate search cache
- On user update → Invalidate user cache

---

## ML Service Integration Strategy

### Architecture (Future)

```
┌─────────────┐
│  Go API     │
│  (Gin)      │
└──────┬──────┘
       │ HTTP REST
       │
┌──────▼──────┐
│ Python ML   │
│ Service     │
│ (FastAPI)   │
└──────┬──────┘
       │
┌──────▼──────┐
│  MinIO      │
│  (Images)   │
└─────────────┘
```

### Communication Pattern

**Synchronous (Simple):**
```
1. Client uploads image → Go API
2. Go API stores in MinIO
3. Go API calls ML service: POST /process
4. ML service processes (OCR + extraction)
5. ML service returns extracted data
6. Go API stores in database
7. Go API returns to client
```

**Asynchronous (Better for long processing):**
```
1. Client uploads image → Go API
2. Go API stores in MinIO
3. Go API calls ML service: POST /process (async)
4. ML service returns: {job_id, status: "processing"}
5. Go API stores job_id in database
6. Client polls: GET /images/:id/status
7. ML service completes → Updates status
8. Client gets result: GET /images/:id/result
```

### ML Service API (Future)

```
POST   /process           # Submit image for processing
GET    /jobs/:id/status   # Get processing status
GET    /jobs/:id/result   # Get extracted nutrition data
```

---

## Deployment Strategy

### Docker Compose Structure

```yaml
services:
  postgres:
    image: postgres:18-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: modi
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:8-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  api:
    build: 
      context: ./modi
      dockerfile: Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/modi?sslmode=disable
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 8080
    ports:
      - "8080:8080"
    restart: unless-stopped
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    restart: unless-stopped
  
  minio:  # For image storage (future)
    image: minio/minio:latest
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Go Project Structure

```
modi/
├── cmd/
│   └── api/
│       └── main.go              # Application entry point
├── src/
│   ├── config/                  # Configuration management
│   │   └── config.go
│   ├── handlers/                # HTTP handlers (Gin routes)
│   │   ├── auth.go
│   │   ├── workouts.go
│   │   ├── weights.go
│   │   └── foods.go
│   ├── middleware/              # Middleware
│   │   ├── auth.go
│   │   ├── logging.go
│   │   └── rate_limit.go
│   ├── models/                  # Domain models
│   │   ├── user.go
│   │   ├── workout.go
│   │   └── food.go
│   ├── repositories/            # Data access layer
│   │   ├── user_repository.go
│   │   ├── workout_repository.go
│   │   └── food_repository.go
│   ├── services/                # Business logic
│   │   ├── auth_service.go
│   │   ├── workout_service.go
│   │   ├── sync_service.go
│   │   └── food_service.go
│   └── utils/                   # Utilities
│       ├── jwt.go
│       └── validator.go
├── migrations/                  # SQL migrations
│   └── 001_initial_schema.sql
├── pkg/                        # Public packages (if any)
├── Dockerfile
├── go.mod
├── go.sum
└── .env.example
```

### TrueNAS Scale Deployment

**Considerations:**
- Use TrueNAS Kubernetes (k3s) or Docker Compose
- Persistent volumes for PostgreSQL data
- Backup strategy using TrueNAS snapshots
- Resource limits per container
- Health checks for all services
- Log aggregation (optional: Loki + Grafana)

---

## Security Strategy

### Authentication & Authorization

1. **Password Security:**
   - Argon2id for password hashing (better than bcrypt)
   - Salt per password
   - Minimum password requirements

2. **JWT Security:**
   - Short-lived access tokens (15 min)
   - Refresh tokens stored server-side (Redis)
   - Token rotation on refresh
   - Secure token storage (httpOnly cookies option)

3. **Rate Limiting:**
   - Per-user rate limits (Redis-based)
   - Per-endpoint limits
   - IP-based limits for auth endpoints

### API Security

1. **HTTPS Only:**
   - Enforced via Cloudflare Tunnel
   - Nginx SSL termination

2. **Input Validation:**
   - Struct validation with go-playground/validator
   - SQL injection prevention (parameterized queries)
   - XSS prevention (input sanitization)

3. **CORS:**
   - Configured for specific origins
   - Credentials support for cookies

### Data Security

1. **Encryption:**
   - Database connections (SSL/TLS)
   - Data at rest (TrueNAS encryption)
   - Sensitive fields encrypted (passwords)

2. **GDPR Compliance:**
   - Data export encryption
   - Secure deletion procedures
   - Access logging

---

## Monitoring & Logging Strategy

### Logging

**Structured Logging:**
- Use `zerolog` or `zap` for structured logs
- JSON format for production
- Include: request_id, user_id, timestamp, level, message

**Log Levels:**
- ERROR: Application errors, exceptions
- WARN: Deprecated usage, recoverable issues
- INFO: Important events (login, sync, etc.)
- DEBUG: Detailed debugging information

### Monitoring

**Health Checks:**
- `/health` - Basic health check
- `/ready` - Readiness check (database, Redis connections)

**Metrics (Future):**
- Prometheus metrics endpoint
- Request duration
- Error rates
- Database query times
- Cache hit rates

**Error Tracking:**
- Structured error logging
- Optional: Sentry integration (self-hosted or cloud)

### Backups

**Database Backups:**
- Daily automated backups (`pg_dump`)
- TrueNAS snapshot integration
- Off-site backup strategy
- Test restore procedures

**Backup Retention:**
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

---

## Scalability Strategy

### Horizontal Scaling

**Stateless API:**
- Go API is stateless (no in-memory state)
- Can run multiple instances
- Load balanced via Nginx

**Database Scaling:**
- Connection pooling (pgx pool)
- Read replicas (future, if needed)
- Query optimization (indexes, explain analyze)

**Cache Scaling:**
- Redis can be clustered (future)
- Cache warming strategies
- Cache sharding by user_id

### Performance Optimization

1. **Database:**
   - Proper indexes
   - Query optimization
   - Connection pooling
   - Prepared statements

2. **Caching:**
   - Aggressive caching for read-heavy endpoints
   - Cache warming for popular data
   - Smart cache invalidation

3. **API:**
   - Response compression (gzip)
   - Pagination for large datasets
   - Field selection (only return needed fields)

---

## Implementation Phases

### Phase 1: Foundation
- Set up Go project with Gin
- PostgreSQL database schema
- Basic CRUD for workouts and weights
- User authentication (register/login)
- JWT token management
- Docker Compose setup

### Phase 2: Sync & GDPR
- Implement sync logic (incremental sync)
- Conflict resolution
- Data export functionality
- Account deletion (GDPR)
- Audit logging
- Consent management

### Phase 3: Food Database
- Food model and CRUD
- Full-text search (PostgreSQL)
- User-contributed foods
- Food logging
- Daily macro summaries
- Caching strategy

### Phase 4: ML Integration (Future)
- Image upload endpoint
- MinIO setup
- Python ML service setup
- OCR processing pipeline
- Food extraction from images
- Integration with food database

---

## Key Architectural Decisions

1. **Go + Gin**: Chosen for simplicity, performance, and ecosystem
2. **PostgreSQL**: Robust, feature-rich, perfect for our use case
3. **Redis**: Fast caching and session management
4. **Separate ML Service**: Python is better for ML, isolates concerns
5. **Monolithic API**: Start simple, extract services later if needed
6. **UUIDs**: Better for distributed sync
7. **Soft Deletes**: Required for GDPR and sync
8. **Optimistic Concurrency**: Simple conflict resolution for sync
9. **Repository Pattern**: Abstraction for testability and flexibility
10. **Layered Architecture**: Clear separation of concerns

---

## Resources

- Go Documentation: https://go.dev/doc/
- Gin Framework: https://gin-gonic.com/docs/
- pgx Driver: https://github.com/jackc/pgx
- Redis Go Client: https://github.com/redis/go-redis
- PostgreSQL Documentation: https://www.postgresql.org/docs
- FastAPI (Future ML): https://fastapi.tiangolo.com/
- GDPR Compliance: https://gdpr.eu
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
- TrueNAS Scale: https://www.truenas.com/truenas-scale
