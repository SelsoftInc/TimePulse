-- =============================================
-- MIGRATION: Create Timesheet Audit Table
-- Date: 2025-11-16
-- Description: Creates audit table to track all timesheet changes
-- =============================================

-- Create timesheet_audit table
CREATE TABLE IF NOT EXISTS timesheet_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to the timesheet being audited
    timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
    
    -- Action performed (create, update, delete, submit, approve, reject)
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'submit', 'approve', 'reject', 'draft_save')),
    
    -- Who made the change
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_by_email VARCHAR(255), -- Store email for reference even if user is deleted
    
    -- When the change occurred
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Old and new values (stored as JSONB for flexibility)
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    
    -- Fields that changed (array of field names)
    changed_fields TEXT[] DEFAULT '{}',
    
    -- Additional metadata
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- For any additional context
    
    -- Tenant ID for filtering (denormalized for performance)
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Employee ID for filtering (denormalized for performance)
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_timesheet_audit_timesheet_id ON timesheet_audit(timesheet_id);
CREATE INDEX idx_timesheet_audit_tenant_id ON timesheet_audit(tenant_id);
CREATE INDEX idx_timesheet_audit_employee_id ON timesheet_audit(employee_id);
CREATE INDEX idx_timesheet_audit_changed_by ON timesheet_audit(changed_by);
CREATE INDEX idx_timesheet_audit_changed_at ON timesheet_audit(changed_at DESC);
CREATE INDEX idx_timesheet_audit_action ON timesheet_audit(action);
CREATE INDEX idx_timesheet_audit_tenant_employee ON timesheet_audit(tenant_id, employee_id);

-- Composite index for common queries
CREATE INDEX idx_timesheet_audit_timesheet_action ON timesheet_audit(timesheet_id, action, changed_at DESC);

-- Add comment to table
COMMENT ON TABLE timesheet_audit IS 'Audit trail for all timesheet changes including create, update, delete, submit, approve, and reject actions';
COMMENT ON COLUMN timesheet_audit.action IS 'Type of action: create, update, delete, submit, approve, reject, draft_save';
COMMENT ON COLUMN timesheet_audit.old_values IS 'Previous values of changed fields (JSONB)';
COMMENT ON COLUMN timesheet_audit.new_values IS 'New values of changed fields (JSONB)';
COMMENT ON COLUMN timesheet_audit.changed_fields IS 'Array of field names that were changed';
COMMENT ON COLUMN timesheet_audit.metadata IS 'Additional context like rejection reason, notes, etc.';

