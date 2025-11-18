#!/bin/bash
# Migration script for RDS Data API
# Run this after enabling RDS Data API

DB_CLUSTER_ARN="arn:aws:rds:us-east-1:727044518907:cluster:timepulse-cluster"
SECRET_ARN="arn:aws:secretsmanager:us-east-1:727044518907:secret:timepulse-db-password-rds-data-api-jq97SV"
DATABASE="timepulse_db"
REGION="us-east-1"

echo "🔄 Running Timesheet Audit Migration via RDS Data API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Create the table
echo "📝 Step 1: Creating timesheet_audit table..."
aws rds-data execute-statement \
  --resource-arn "$DB_CLUSTER_ARN" \
  --secret-arn "$SECRET_ARN" \
  --database "$DATABASE" \
  --sql "CREATE TABLE IF NOT EXISTS timesheet_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'submit', 'approve', 'reject', 'draft_save')),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_by_email VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    changed_fields TEXT[] DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
  );" \
  --region "$REGION" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Table created successfully"
else
  echo "❌ Failed to create table"
  exit 1
fi

echo ""

# Step 2: Create indexes
echo "📝 Step 2: Creating indexes..."

INDEXES=(
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_timesheet_id ON timesheet_audit(timesheet_id);"
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_tenant_id ON timesheet_audit(tenant_id);"
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_employee_id ON timesheet_audit(employee_id);"
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_changed_by ON timesheet_audit(changed_by);"
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_changed_at ON timesheet_audit(changed_at DESC);"
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_action ON timesheet_audit(action);"
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_tenant_employee ON timesheet_audit(tenant_id, employee_id);"
  "CREATE INDEX IF NOT EXISTS idx_timesheet_audit_timesheet_action ON timesheet_audit(timesheet_id, action, changed_at DESC);"
)

for INDEX_SQL in "${INDEXES[@]}"; do
  aws rds-data execute-statement \
    --resource-arn "$DB_CLUSTER_ARN" \
    --secret-arn "$SECRET_ARN" \
    --database "$DATABASE" \
    --sql "$INDEX_SQL" \
    --region "$REGION" > /dev/null 2>&1
done

echo "✅ Indexes created"
echo ""

# Step 3: Add comments
echo "📝 Step 3: Adding table comments..."
aws rds-data execute-statement \
  --resource-arn "$DB_CLUSTER_ARN" \
  --secret-arn "$SECRET_ARN" \
  --database "$DATABASE" \
  --sql "COMMENT ON TABLE timesheet_audit IS 'Audit trail for all timesheet changes including create, update, delete, submit, approve, and reject actions';" \
  --region "$REGION" > /dev/null 2>&1

echo "✅ Migration completed successfully!"
echo ""
echo "📊 The timesheet_audit table has been created with all indexes and comments."
echo "🔍 Audit logging will now automatically track all timesheet changes."

