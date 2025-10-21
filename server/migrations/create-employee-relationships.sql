-- Migration: Create Employee Relationships Table
-- This table centralizes all employee-approver/manager relationships

CREATE TABLE IF NOT EXISTS employee_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    related_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'manager',
        'leave_approver',
        'timesheet_approver',
        'expense_approver',
        'performance_reviewer',
        'mentor',
        'backup_approver'
    )),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT true,
    effective_from TIMESTAMP,
    effective_to TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_employee_relationship_active 
ON employee_relationships(employee_id, relationship_type, is_active);

CREATE INDEX idx_approver_relationship_active 
ON employee_relationships(related_user_id, relationship_type, is_active);

CREATE INDEX idx_tenant_relationship 
ON employee_relationships(tenant_id, relationship_type);

CREATE INDEX idx_employee_tenant 
ON employee_relationships(employee_id, tenant_id);

-- Create unique constraint for primary approvers
-- Only one primary approver per employee per relationship type
CREATE UNIQUE INDEX unique_primary_approver 
ON employee_relationships(employee_id, relationship_type, is_primary, tenant_id)
WHERE is_primary = true AND is_active = true;

-- Add comments
COMMENT ON TABLE employee_relationships IS 'Centralized table for all employee-manager/approver relationships';
COMMENT ON COLUMN employee_relationships.employee_id IS 'The employee who is being managed/supervised';
COMMENT ON COLUMN employee_relationships.related_user_id IS 'The user who has authority over the employee';
COMMENT ON COLUMN employee_relationships.relationship_type IS 'Type of relationship: manager, leave_approver, timesheet_approver, etc.';
COMMENT ON COLUMN employee_relationships.is_primary IS 'Whether this is the primary approver for this relationship type';
COMMENT ON COLUMN employee_relationships.effective_from IS 'When this relationship becomes active';
COMMENT ON COLUMN employee_relationships.effective_to IS 'When this relationship ends (null = ongoing)';
COMMENT ON COLUMN employee_relationships.is_active IS 'Whether this relationship is currently active';

-- Success message
SELECT 'Employee relationships table created successfully!' AS message;
