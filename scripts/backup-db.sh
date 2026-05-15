#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCHEMA="backups/${TIMESTAMP}_schema.sql"
DATA="backups/${TIMESTAMP}_data.sql"
ROLES="backups/${TIMESTAMP}_roles.sql"

echo "Dumping schema to ${SCHEMA}..."
supabase db dump --schema-only -f "$SCHEMA"

echo "Dumping data to ${DATA}..."
supabase db dump --data-only -f "$DATA"

echo "Dumping roles to ${ROLES}..."
supabase db dump --role-only -f "$ROLES"

echo

echo "Summary of created files:"
for f in "$SCHEMA" "$DATA" "$ROLES"; do
  if [ -f "$f" ]; then
    ls -lh "$f" || true
  else
    echo "Missing: $f"
  fi
done

echo "Backups written to backups/"
