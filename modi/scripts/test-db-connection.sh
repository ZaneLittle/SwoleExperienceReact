#!/bin/bash
# Test database connection with the DATABASE_URL from .env

if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

# Load .env file
export $(grep -v '^#' .env | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not set in .env"
    exit 1
fi

echo "Testing database connection..."
echo "DATABASE_URL format: ${DATABASE_URL%%@*}@***"

# Extract components from DATABASE_URL for testing
# Format: postgres://user:pass@host:port/db?params
DB_URL=$DATABASE_URL

# Test with psql if available, otherwise just show the URL
if command -v psql >/dev/null 2>&1; then
    psql "$DB_URL" -c "SELECT version();" 2>&1
else
    echo "psql not installed, cannot test connection directly"
    echo "Please check your server logs when starting with 'make start'"
    echo ""
    echo "Expected format: postgres://postgres:password@localhost:5432/modi?sslmode=disable"
    echo "Your DATABASE_URL: ${DB_URL%%@*}@***"
fi



