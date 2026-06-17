#!/bin/bash
set -e

echo "Setting up database..."
if [ -n "$TURSO_URL" ]; then
  node scripts/setup-db.js
else
  echo "No TURSO_URL — skipping DB setup (local mode)"
fi

exec node src/index.js
