#!/bin/bash
# Database initialization script
# This script checks if the emishops database is already populated
# and imports the SQL file if not.

set -e

DB_HOST="${DB_HOST:-emi_db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-Emishops22!}"
DB_NAME="${DB_NAME:-emishops}"
SQL_FILE="/scripts/emishops.sql"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "=========================================="
echo "  Database Initialization Script"
echo "=========================================="

# Function to check if MariaDB is ready
wait_for_db() {
    echo "Waiting for database to be ready..."
    for i in $(seq 1 $MAX_RETRIES); do
        if mariadb -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &>/dev/null; then
            echo "Database is ready!"
            return 0
        fi
        echo "Attempt $i/$MAX_RETRIES: Database not ready, waiting ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done
    echo "ERROR: Database did not become ready in time"
    return 1
}

# Function to check if database exists
check_database_exists() {
    result=$(mariadb -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -N -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME'" 2>/dev/null)
    [ -n "$result" ]
}

# Function to check if database is populated (has tables with data)
check_database_populated() {
    # Check if the 'settings' table has data (a core table that should always have data)
    result=$(mariadb -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e "SELECT COUNT(*) FROM settings" 2>/dev/null)
    [ "$result" -gt 0 ] 2>/dev/null
}

# Function to import the SQL file
import_database() {
    echo "Importing database from $SQL_FILE..."
    if [ ! -f "$SQL_FILE" ]; then
        echo "ERROR: SQL file not found at $SQL_FILE"
        return 1
    fi
    
    # Create database if it doesn't exist
    mariadb -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
    
    # Import the SQL file
    mariadb -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"
    
    echo "Database import completed successfully!"
}

# Main logic
main() {
    wait_for_db || exit 1
    
    if check_database_exists; then
        echo "Database '$DB_NAME' exists."
        
        if check_database_populated; then
            echo "Database is already populated. Skipping import."
            echo "=========================================="
            exit 0
        else
            echo "Database exists but is empty. Importing data..."
        fi
    else
        echo "Database '$DB_NAME' does not exist. Creating and importing..."
    fi
    
    import_database
    echo "=========================================="
}

main "$@"

