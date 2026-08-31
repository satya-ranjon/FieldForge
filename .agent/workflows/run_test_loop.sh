#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Running full test suite across all monorepo workspaces..."
pnpm turbo run test lint
echo "✅ All tests and linters passed successfully."
