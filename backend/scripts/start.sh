#!/bin/bash
set -e

echo "Setting up database..."
if [ -n "$TURSO_URL" ]; then
  node scripts/setup-db.js
else
  npx prisma db push --accept-data-loss
fi

exec node src/index.js
