#!/bin/bash
set -e

echo "Setting up database..."
if [ -n "$TURSO_URL" ]; then
  # Prisma 6 passes DATABASE_URL to the adapter's connect(datasourceUrl).
  # Set it to the full libsql URL with authToken so the adapter can connect.
  export DATABASE_URL="${TURSO_URL}?authToken=${TURSO_TOKEN:-}"
  node scripts/setup-db.js
else
  npx prisma db push --accept-data-loss
fi

exec node src/index.js
