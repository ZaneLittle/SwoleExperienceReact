#!/bin/bash
# Create database schema

echo "Creating database schema..."

# Load .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Default connection string
DB_URL="${DATABASE_URL:-postgres://postgres:password@localhost:5432/modi?sslmode=disable}"

# Check if psql is available
if ! command -v psql >/dev/null 2>&1; then
    echo "psql not found. Using docker exec instead..."
    docker exec -i modi-postgres psql -U postgres -d modi < migrations/001_create_users_table.sql
else
    psql "$DB_URL" -f migrations/001_create_users_table.sql
fi

if [ $? -eq 0 ]; then
    echo "✓ Schema created successfully"
else
    echo "✗ Failed to create schema"
    exit 1
fi



