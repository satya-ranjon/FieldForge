#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Bootstrapping FieldForge local development environment..."

# Check prerequisites
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required."; exit 1; }

echo "📦 Installing Monorepo Node.js dependencies..."
pnpm install

echo "🐳 Starting local Docker containers (MySQL, Redis, RabbitMQ, Jaeger)..."
pnpm docker:up

echo "⏳ Waiting for MySQL to become healthy..."
sleep 5

echo "✨ FieldForge dev environment ready!"
