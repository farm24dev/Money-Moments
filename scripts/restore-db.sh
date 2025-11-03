#!/bin/bash

# Restore PostgreSQL Database
# Usage: ./restore-db.sh <backup_file.sql.gz>

if [ -z "$1" ]; then
    echo "❌ Error: Please provide backup file"
    echo "Usage: ./restore-db.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lht ./backups/*.gz | head -10
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

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

echo "======================================"
echo "🔄 Database Restore"
echo "======================================"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup file: $BACKUP_FILE"
echo "======================================"

# Warning
echo ""
echo "⚠️  WARNING: This will replace all data in the database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Export password
export PGPASSWORD=$DB_PASS

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo ""
    echo "Decompressing backup..."
    SQL_FILE="${BACKUP_FILE%.gz}"
    gunzip -c $BACKUP_FILE > $SQL_FILE
    TEMP_FILE=$SQL_FILE
else
    TEMP_FILE=$BACKUP_FILE
fi

echo ""
echo "Dropping existing database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "Creating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

echo "Restoring database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $TEMP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully!"
    
    # Clean up temp file if we decompressed
    if [[ $BACKUP_FILE == *.gz ]] && [ -f "$TEMP_FILE" ]; then
        rm $TEMP_FILE
        echo "🗑️  Cleaned up temporary file"
    fi
else
    echo "❌ Restore failed!"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "======================================"
echo "Restore process completed!"
echo "======================================"
