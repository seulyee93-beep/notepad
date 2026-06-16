#!/bin/bash
set -e

if [ -n "$TURSO_URL" ]; then
  export DATABASE_URL="${TURSO_URL}?authToken=${TURSO_TOKEN:-}"
  echo "Turso DB detected — pushing schema..."
  npx prisma db push --accept-data-loss
else
  echo "Local SQLite — pushing schema..."
  npx prisma db push --accept-data-loss
fi

exec node src/index.js
