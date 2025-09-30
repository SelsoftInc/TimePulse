-- =============================================
-- MIGRATION: Create/Update Timesheets Table
-- Date: 2025-09-30
-- Description: Ensures timesheets table matches the Sequelize model
-- =============================================

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS timesheets CASCADE;

-- Create timesheets table
CREATE TABLE timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Week range (Monday to Sunday)
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    
    -- Daily hours stored as JSONB
    -- { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
    daily_hours JSONB DEFAULT '{"mon": 0, "tue": 0, "wed": 0, "thu": 0, "fri": 0, "sat": 0, "sun": 0}'::jsonb,
    
    -- Total hours for the week
    total_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Status workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    
    -- Optional fields for notes and attachments
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Approval tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_timesheets_tenant ON timesheets(tenant_id);
CREATE INDEX idx_timesheets_employee ON timesheets(employee_id);
CREATE INDEX idx_timesheets_client ON timesheets(client_id);
CREATE INDEX idx_timesheets_week ON timesheets(week_start, week_end);
CREATE INDEX idx_timesheets_status ON timesheets(status);

-- Unique constraint: one timesheet per employee per week
CREATE UNIQUE INDEX idx_timesheets_unique_employee_week 
ON timesheets(tenant_id, employee_id, week_start, week_end);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_timesheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_timesheets_updated_at
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_timesheets_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON timesheets TO PUBLIC;
