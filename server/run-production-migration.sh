#!/bin/bash
# Production Database Migration Script

echo "=== Production Database Migration ==="
echo ""

# Set production environment
export NODE_ENV=production
export USE_LOCAL_DB=false
export DB_HOST=timepulse-cluster.cluster-chb4yd9ykrnf.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=timepulse_db
export DB_USER=postgres
export DB_SSL=true
export DB_SSL_REJECT_UNAUTHORIZED=false

# Get password from AWS Secrets Manager
echo "Getting database password from AWS Secrets Manager..."
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id timepulse-db-password-ockLr9 \
  --region us-east-1 \
  --query SecretString \
  --output text 2>/dev/null)

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Could not get password from AWS Secrets Manager"
  echo ""
  echo "Please run this manually:"
  echo "  1. Get password from AWS Secrets Manager"
  echo "  2. Set: export DB_PASSWORD='your-password'"
  echo "  3. Run: node scripts/add-daily-hours-column.js"
  exit 1
fi

export DB_PASSWORD
echo "✅ Password retrieved"
echo ""
echo "Running migration script..."
echo ""

node scripts/add-daily-hours-column.js
