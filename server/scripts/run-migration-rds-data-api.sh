#!/bin/bash
# Complete migration script for RDS Data API
# Run this after enabling RDS Data API

set -e

DB_CLUSTER_ARN="arn:aws:rds:us-east-1:727044518907:cluster:timepulse-cluster"
SECRET_ARN="arn:aws:secretsmanager:us-east-1:727044518907:secret:timepulse-db-password-rds-data-api-jq97SV"
DATABASE="timepulse_db"
REGION="us-east-1"

echo "🔄 Running Timesheet Audit Migration via RDS Data API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Read the SQL file
SQL_FILE="server/database/migrations/2025-11-16_create_timesheet_audit_table.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found: $SQL_FILE"
    exit 1
fi

SQL_CONTENT=$(cat "$SQL_FILE")

echo "📝 Executing migration SQL..."
echo "SQL length: ${#SQL_CONTENT} characters"
echo ""

# Execute the migration
RESULT=$(aws rds-data execute-statement \
  --resource-arn "$DB_CLUSTER_ARN" \
  --secret-arn "$SECRET_ARN" \
  --database "$DATABASE" \
  --sql "$SQL_CONTENT" \
  --region "$REGION" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
    echo ""
    echo "📊 The timesheet_audit table has been created."
    echo "🔍 Audit logging will now automatically track all timesheet changes."
else
    echo "❌ Migration failed:"
    echo "$RESULT"
    exit 1
fi

