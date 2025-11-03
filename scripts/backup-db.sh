#!/bin/bash

# Backup PostgreSQL Database
# Usage: ./backup-db.sh

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Extract database credentials from DATABASE_URL
# Format: postgres://user:password@host:port/database
DB_URL=${DATABASE_URL}

# Parse DATABASE_URL
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\(.*\)/\1/p')

# Create backup directory if not exists
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "======================================"
echo "🗄️  Database Backup"
echo "======================================"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup file: $BACKUP_FILE"
echo "======================================"

# Export password for pg_dump
export PGPASSWORD=$DB_PASS

# Create backup
echo "Starting backup..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📁 File: $BACKUP_FILE"
    
    # Show file size
    FILE_SIZE=$(ls -lh $BACKUP_FILE | awk '{print $5}')
    echo "📦 Size: $FILE_SIZE"
    
    # Compress backup
    echo ""
    echo "Compressing backup..."
    gzip $BACKUP_FILE
    COMPRESSED_FILE="$BACKUP_FILE.gz"
    COMPRESSED_SIZE=$(ls -lh $COMPRESSED_FILE | awk '{print $5}')
    echo "✅ Compressed: $COMPRESSED_FILE"
    echo "📦 Compressed size: $COMPRESSED_SIZE"
    
    # List recent backups
    echo ""
    echo "Recent backups:"
    ls -lht $BACKUP_DIR/*.gz | head -5
else
    echo "❌ Backup failed!"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "======================================"
echo "Backup process completed!"
echo "======================================"
