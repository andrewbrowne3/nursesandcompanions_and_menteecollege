#!/bin/bash
set -e

DB_DIR="/data/db"
DB_FILE="${DB_DIR}/db.sqlite3"
APP_DB="/app/db.sqlite3"

# Ensure the persistent volume directory exists
mkdir -p "$DB_DIR"

# Seed the DB on first run (if no DB in volume yet)
if [ ! -f "$DB_FILE" ]; then
    if [ -f "$APP_DB" ]; then
        echo "Seeding database from image..."
        cp "$APP_DB" "$DB_FILE"
    else
        echo "No seed database found. Django will create one on first migrate."
    fi
fi

# Symlink so Django always uses the volume-backed DB
ln -sf "$DB_FILE" "$APP_DB"

# Run migrations
python manage.py migrate --noinput || true

exec "$@"
