#!/usr/bin/env bash
set -euo pipefail

echo "🌱 Seeding FieldForge MySQL database with mock technicians, buyers, and gigs..."
pnpm --filter @fieldforge/database db:seed
echo "✅ Database seeded successfully."
