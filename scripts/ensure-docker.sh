#!/usr/bin/env bash
set -euo pipefail

# Check if Docker CLI is installed
command -v docker >/dev/null 2>&1 || {
  echo "❌ Error: docker is not installed. Please install Docker first."
  exit 1
}

# Check if Docker daemon is responsive
if docker info >/dev/null 2>&1; then
  exit 0
fi

echo "🐳 Docker daemon is not running. Attempting to start Docker..."

# macOS
if [[ "$(uname -s)" == "Darwin" ]]; then
  if [ -d "/Applications/Docker.app" ] || [ -d "${HOME}/Applications/Docker.app" ]; then
    echo "🚀 Starting Docker Desktop..."
    open -a Docker 2>/dev/null || open -a "/Applications/Docker.app" 2>/dev/null || true
  elif command -v colima >/dev/null 2>&1; then
    echo "🚀 Starting Colima..."
    colima start 2>/dev/null || true
  elif command -v orb >/dev/null 2>&1 || [ -d "/Applications/OrbStack.app" ]; then
    echo "🚀 Starting OrbStack..."
    open -a OrbStack 2>/dev/null || true
  fi
# Linux
elif [[ "$(uname -s)" == "Linux" ]]; then
  if command -v systemctl >/dev/null 2>&1; then
    echo "🚀 Starting Docker service..."
    sudo systemctl start docker 2>/dev/null || true
  elif command -v service >/dev/null 2>&1; then
    echo "🚀 Starting Docker service..."
    sudo service docker start 2>/dev/null || true
  fi
fi

# Wait for Docker daemon to become responsive (up to 60s)
echo "⏳ Waiting for Docker daemon to initialize..."
MAX_ATTEMPTS=30
ATTEMPT=0

while ! docker info >/dev/null 2>&1; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ "${ATTEMPT}" -ge "${MAX_ATTEMPTS}" ]; then
    echo "❌ Timed out waiting for Docker daemon to start."
    echo "Please start Docker manually and run this command again."
    exit 1
  fi
  sleep 2
done

echo "✅ Docker daemon is ready."
