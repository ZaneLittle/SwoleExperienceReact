# Test Strategy for Modi

This document outlines the testing strategy for the Modi backend API, including unit tests and integration tests.

## Overview

Modi uses a comprehensive testing strategy to ensure code quality, reliability, and maintainability. Tests are organized into two main categories:

1. **Unit Tests** - Test individual components in isolation
2. **Integration Tests** - Test component interactions and external dependencies

## Test Structure

```
modi/
├── internal/
│   ├── config/
│   │   └── config_test.go
│   ├── handlers/
│   │   └── *_test.go
│   ├── middleware/
│   │   └── *_test.go
│   ├── models/
│   │   └── *_test.go
│   ├── repositories/
│   │   └── *_test.go
│   ├── services/
│   │   └── *_test.go
│   └── utils/
│       └── *_test.go
└── integration/
    └── *_test.go
```

## Testing Tools

### Test Framework
- **Go's built-in `testing` package** - Primary testing framework
- **Testify** (`github.com/stretchr/testify`) - Assertions and test suites
  - `assert` - Simple assertions
  - `require` - Assertions that stop test on failure
  - `suite` - Test suite support
  - `mock` - Mocking framework

### Test Utilities
- **httptest** - HTTP testing utilities
- **pgxmock** - PostgreSQL mock driver for unit tests
- **Redis mock** - Redis client mock for unit tests

## Unit Tests

### Purpose
Unit tests verify individual functions, methods, and components work correctly in isolation, without external dependencies.

### Scope
- **Models** - Data validation, conversions, business logic
- **Config** - Configuration loading and validation
- **Utils** - Helper functions and utilities
- **Handlers** - Request/response handling (with mocked dependencies)
- **Services** - Business logic (with mocked repositories)
- **Repositories** - Data access layer (with mocked database)
- **Middleware** - Authentication, logging, validation

### Best Practices
1. **One test file per source file**: `source.go` → `source_test.go`
2. **Table-driven tests**: Use for multiple input scenarios
3. **Mock dependencies**: Don't use real database/Redis in unit tests
4. **Fast execution**: Unit tests should run in < 1 second total
5. **Isolated tests**: Each test should be independent

### Example Unit Test Structure
```go
package handlers_test

import (
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

func TestHealthHandler_Health(t *testing.T) {
    tests := []struct {
        name           string
        setupMocks     func()
        expectedStatus int
        expectedBody   map[string]interface{}
    }{
        {
            name: "healthy services",
            setupMocks: func() {
                // Setup mocks
            },
            expectedStatus: http.StatusOK,
            expectedBody: map[string]interface{}{
                "status": "ok",
            },
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test implementation
        })
    }
}
```

## Integration Tests

### Purpose
Integration tests verify that components work together correctly with real or test databases and external services.

### Scope
- **API Endpoints** - Full request/response cycle
- **Database Operations** - Real database queries and transactions
- **Redis Operations** - Real Redis cache operations
- **Service Integration** - Services with real repositories
- **Authentication Flow** - Complete auth flow with JWT

### Test Database Setup
- Use test database (e.g., `modi_test`)
- Run migrations before tests
- Clean up after each test (transaction rollback or truncate)
- Use test containers for PostgreSQL and Redis

### Best Practices
1. **Separate test database**: Never use production database
2. **Clean state**: Reset database between tests
3. **Test containers**: Use Docker containers for PostgreSQL/Redis
4. **Real HTTP requests**: Use `httptest` for actual HTTP calls
5. **Idempotent tests**: Tests should be runnable multiple times

### Example Integration Test Structure
```go
package integration_test

import (
    "testing"
    
    "github.com/stretchr/testify/suite"
)

type HealthCheckTestSuite struct {
    suite.Suite
    db    *pgxpool.Pool
    redis *redis.Client
    app   *gin.Engine
}

func (s *HealthCheckTestSuite) SetupSuite() {
    // Setup test database and Redis
    // Initialize application
}

func (s *HealthCheckTestSuite) TearDownSuite() {
    // Cleanup test database and Redis
}

func (s *HealthCheckTestSuite) TestHealthCheck() {
    // Integration test implementation
}

func TestHealthCheckSuite(t *testing.T) {
    suite.Run(t, new(HealthCheckTestSuite))
}
```

## Test Categories

### 1. Model Tests
**Location**: `internal/models/*_test.go`

Test data models:
- Validation logic
- Data conversion (to/from JSON, database)
- Business rules
- Type constraints

**Example**: Test `User` model validation, `Workout` sync version handling

### 2. Handler Tests
**Location**: `internal/handlers/*_test.go`

Test HTTP handlers:
- Request parsing and validation
- Response formatting
- Error handling
- Status codes

**Mocks**: Services, repositories

**Example**: Test `HealthHandler`, `AuthHandler` endpoints

### 3. Service Tests
**Location**: `internal/services/*_test.go`

Test business logic:
- Service methods
- Business rules
- Data transformations
- Error handling

**Mocks**: Repositories

**Example**: Test `WorkoutService.SyncWorkouts`, `AuthService.Login`

### 4. Repository Tests
**Location**: `internal/repositories/*_test.go`

Test data access:
- SQL queries
- Database operations (CRUD)
- Transaction handling
- Error handling

**Mocks**: Database driver (pgxmock)

**Example**: Test `WorkoutRepository.GetByUserID`, `UserRepository.Create`

### 5. Middleware Tests
**Location**: `internal/middleware/*_test.go`

Test middleware:
- Authentication checks
- Request validation
- Rate limiting
- Logging

**Example**: Test JWT authentication middleware, rate limiting

### 6. Integration Tests
**Location**: `integration/*_test.go`

Test complete flows:
- Full API request/response
- Database + API integration
- Redis + API integration
- Multi-component workflows

**Example**: Test complete sync flow, authentication flow

## Running Tests

### Run All Tests
```bash
go test ./...
```

### Run Tests with Coverage
```bash
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

### Run Unit Tests Only
```bash
go test ./internal/... -short
```

### Run Integration Tests Only
```bash
go test ./integration/... -tags=integration
```

### Run Specific Package
```bash
go test ./internal/handlers/...
```

### Run Specific Test
```bash
go test -run TestHealthHandler ./internal/handlers/...
```

### Run Tests in Watch Mode
```bash
# Requires air or similar tool
air test
```

## Test Coverage Goals

- **Overall Coverage**: ≥ 80%
- **Critical Paths**: 100% (auth, sync, data access)
- **Models**: ≥ 90%
- **Handlers**: ≥ 80%
- **Services**: ≥ 85%
- **Repositories**: ≥ 85%

## Continuous Integration

Tests are automatically run:
- On every pull request (blocking)
- On every push to main branch
- Before merging PRs

### CI Requirements
- All tests must pass
- Coverage threshold must be met
- No race conditions
- Linting passes

## Test Data Management

### Fixtures
- Store test fixtures in `testdata/` directory
- Use JSON files for complex test data
- Keep fixtures realistic but minimal

### Factories
- Create test data factories for models
- Make it easy to generate test objects
- Example: `testutils.NewUser()`, `testutils.NewWorkout()`

## Mock Strategy

### When to Mock
- External dependencies (database, Redis, HTTP clients)
- Slow operations
- Non-deterministic behavior
- Dependencies not yet implemented

### When NOT to Mock
- Pure functions
- Simple data structures
- Integration tests (use real dependencies)

### Mock Libraries
- **testify/mock** - General mocking
- **pgxmock** - PostgreSQL mocking
- **Custom mocks** - For interfaces (generate with `mockgen`)

## Performance Testing

### Load Testing
- Use tools like `k6` or `vegeta` for load testing
- Test endpoints under load
- Measure response times and throughput

### Benchmark Tests
```go
func BenchmarkHandler(b *testing.B) {
    // Benchmark implementation
}
```

Run with:
```bash
go test -bench=. -benchmem
```

## Test Best Practices

1. **Test Naming**: `Test<Function>_<Scenario>` format
2. **Arrange-Act-Assert**: Structure tests clearly
3. **One assertion per concept**: Don't assert multiple unrelated things
4. **Test edge cases**: Empty inputs, null values, boundaries
5. **Test error cases**: Invalid inputs, failures, timeouts
6. **Keep tests fast**: Unit tests should be < 100ms each
7. **Clean up**: Always clean up test data/resources
8. **Documentation**: Add comments for complex test scenarios

## Common Test Patterns

### Table-Driven Tests
```go
tests := []struct {
    name string
    input string
    expected error
}{
    {"valid email", "test@example.com", nil},
    {"invalid email", "invalid", ErrInvalidEmail},
}
```

### Test Fixtures
```go
func setupTestDB(t *testing.T) *pgxpool.Pool {
    // Setup test database
    return db
}

func teardownTestDB(t *testing.T, db *pgxpool.Pool) {
    // Cleanup
}
```

### Test Helpers
```go
func createTestUser(t *testing.T, db *pgxpool.Pool) *models.User {
    // Helper to create test user
}
```

## Future Enhancements

- [ ] Property-based testing with `gopter`
- [ ] Contract testing for API
- [ ] Performance regression testing
- [ ] Security testing (OWASP)
- [ ] Mutation testing
- [ ] Visual regression testing for API responses

## Resources

- [Go Testing Documentation](https://pkg.go.dev/testing)
- [Testify Documentation](https://github.com/stretchr/testify)
- [Effective Go - Testing](https://go.dev/doc/effective_go#testing)

