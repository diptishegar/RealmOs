#!/bin/bash
# RealmOs – Run all migrations against the EC2 PostgreSQL database
# Usage: bash run_migrations.sh

DB_HOST="13.127.71.96"
DB_PORT="5432"
DB_USER="realmos_user"
DB_NAME="realmos"
MIGRATIONS_DIR="$(dirname "$0")/migrations"

echo "==> Connecting to PostgreSQL at $DB_HOST..."
echo ""

run_migration() {
  local file="$1"
  echo "--> Running: $(basename $file)"
  PGPASSWORD="123benhart#$" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$file"
  if [ $? -eq 0 ]; then
    echo "    ✓ Done"
  else
    echo "    ✗ FAILED — stopping."
    exit 1
  fi
  echo ""
}

run_migration "$MIGRATIONS_DIR/001_init.sql"
run_migration "$MIGRATIONS_DIR/002_period.sql"
run_migration "$MIGRATIONS_DIR/003_sleep_nutrition_exercise.sql"
run_migration "$MIGRATIONS_DIR/004_auth.sql"
run_migration "$MIGRATIONS_DIR/005_multiuser_auth.sql"
run_migration "$MIGRATIONS_DIR/006_username.sql"

echo "==> All migrations complete ✓"
