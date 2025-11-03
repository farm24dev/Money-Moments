#!/bin/bash

# Restore script for Money Moments application
# This script restores the PostgreSQL database from a backup file

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a backup file"
    echo "Usage: ./restore.sh <backup_file.sql>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/backup_*.sql 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Database credentials (update these for VPS)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-savings}"
DB_USER="${DB_USER:-savings_user}"
DB_PASSWORD="${DB_PASSWORD:-savings_password}"

echo "🔄 Starting database restore..."
echo "📁 Backup file: $BACKUP_FILE"
echo "🎯 Target database: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""
echo "⚠️  WARNING: This will DROP and RECREATE the database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🗑️  Dropping existing database..."
PGPASSWORD=$DB_PASSWORD dropdb \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  --if-exists \
  $DB_NAME

echo "📦 Creating new database..."
PGPASSWORD=$DB_PASSWORD createdb \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  $DB_NAME

echo "📥 Restoring data..."
PGPASSWORD=$DB_PASSWORD pg_restore \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -v \
  "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Restore completed successfully!"
    echo "🎉 Database is ready to use"
else
    echo ""
    echo "❌ Restore failed!"
    exit 1
fi
