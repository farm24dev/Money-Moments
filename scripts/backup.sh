#!/bin/bash

# Backup script for Money Moments application
# This script backs up the PostgreSQL database

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Database credentials (from .env)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="savings"
DB_USER="savings_user"
DB_PASSWORD="savings_password"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "📅 Timestamp: $TIMESTAMP"

# Export database
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📁 Backup file: $BACKUP_FILE"
    
    # Show file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📊 File size: $SIZE"
    
    # Keep only last 10 backups
    echo "🧹 Cleaning old backups (keeping last 10)..."
    ls -t "$BACKUP_DIR"/backup_*.sql | tail -n +11 | xargs -r rm
    
    echo ""
    echo "📋 Available backups:"
    ls -lh "$BACKUP_DIR"/backup_*.sql
else
    echo "❌ Backup failed!"
    exit 1
fi
