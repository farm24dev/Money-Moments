#!/bin/bash

# Backup PostgreSQL Database using Docker
# Usage: ./backup-db-docker.sh

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Extract database credentials from DATABASE_URL
DB_URL=${DATABASE_URL}

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
echo "🗄️  Database Backup (Docker)"
echo "======================================"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup file: $BACKUP_FILE"
echo "======================================"

# Find PostgreSQL container
CONTAINER_NAME="postgres"

# Try to find running postgres container by name pattern
RUNNING_CONTAINER=$(docker ps --filter "name=db" --format "{{.Names}}" | head -n 1)

if [ -z "$RUNNING_CONTAINER" ]; then
    # Try to find by image
    RUNNING_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -n 1)
fi

if [ -z "$RUNNING_CONTAINER" ]; then
    echo "❌ Error: No running PostgreSQL container found"
    echo ""
    echo "Running containers:"
    docker ps
    echo ""
    echo "Please make sure PostgreSQL is running in Docker"
    exit 1
fi

echo "Using container: $RUNNING_CONTAINER"
echo ""
echo "Starting backup..."

# Create backup using docker exec
docker exec -e PGPASSWORD=$DB_PASS $RUNNING_CONTAINER pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE

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
    ls -lht $BACKUP_DIR/*.gz 2>/dev/null | head -5 || echo "  (no previous backups)"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo ""
echo "======================================"
echo "Backup process completed!"
echo "======================================"
