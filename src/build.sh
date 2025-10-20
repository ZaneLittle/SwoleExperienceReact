#!/bin/bash

# Build script for SwoleExperience React app with Vite

echo "Building SwoleExperience React app with Vite..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the app
echo "Building with Vite..."
npm run build

echo "Build completed! Output is in the 'dist' directory."
