#!/bin/bash
# Script to verify .env configuration

echo "Checking .env configuration..."
echo ""

if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Copy .env.example to .env and configure it."
    exit 1
fi

# Check if required variables are set (without showing values)
source .env 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set in .env"
    exit 1
else
    echo "✓ DATABASE_URL is set"
fi

if [ -z "$REDIS_URL" ]; then
    echo "ERROR: REDIS_URL is not set in .env"
    exit 1
else
    echo "✓ REDIS_URL is set"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "ERROR: JWT_SECRET is not set in .env"
    exit 1
else
    echo "✓ JWT_SECRET is set"
fi

echo ""
echo "All required environment variables are set!"
echo ""
echo "Expected values:"
echo "  DATABASE_URL=postgres://postgres:password@localhost:5432/modi?sslmode=disable"
echo "  REDIS_URL=redis://localhost:6379"
echo "  JWT_SECRET=<your-secret-key>"



