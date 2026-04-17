#!/bin/bash
# Server startup test script

cd server

echo "======================================="
echo "  ChatX Backend Startup Test"
echo "======================================="
echo ""
echo "Checking Node.js installation..."
node --version

echo ""
echo "Checking npm packages..."
npm list --depth=0

echo ""
echo "Environment variables loaded from .env:"
echo "  PORT: ${PORT:-5000}"
echo "  NODE_ENV: ${NODE_ENV:-development}"
echo "  MONGODB_URI: ${MONGODB_URI:-mongodb://localhost:27017/chatx}"

echo ""
echo "======================================="
echo "Starting development server..."
echo "======================================="
echo ""

npm run dev
