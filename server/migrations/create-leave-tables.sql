-- Migration: Create Leave Management Tables
-- Run this script to create leave_requests and leave_balances tables

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'unpaid', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    attachment_url VARCHAR(500),
    attachment_name VARCHAR(255),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for leave_requests
CREATE INDEX idx_leave_requests_employee_tenant ON leave_requests(employee_id, tenant_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_tenant_status ON leave_requests(tenant_id, status);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'unpaid', 'other')),
    total_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    pending_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    carry_forward_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_year_leave_type UNIQUE (employee_id, tenant_id, year, leave_type)
);

-- Create indexes for leave_balances
CREATE INDEX idx_leave_balances_employee_tenant ON leave_balances(employee_id, tenant_id);
CREATE INDEX idx_leave_balances_tenant_year ON leave_balances(tenant_id, year);

-- Add comments
COMMENT ON TABLE leave_requests IS 'Stores employee leave requests';
COMMENT ON TABLE leave_balances IS 'Stores employee leave balances by year and type';

COMMENT ON COLUMN leave_requests.leave_type IS 'Type of leave: vacation, sick, personal, unpaid, other';
COMMENT ON COLUMN leave_requests.total_days IS 'Total number of days (can be fractional for half days)';
COMMENT ON COLUMN leave_requests.status IS 'Current status: pending, approved, rejected, cancelled';
COMMENT ON COLUMN leave_requests.reviewed_by IS 'User ID who approved/rejected the request';
COMMENT ON COLUMN leave_requests.review_comments IS 'Comments from reviewer (especially for rejections)';

COMMENT ON COLUMN leave_balances.year IS 'Year for which this balance applies';
COMMENT ON COLUMN leave_balances.total_days IS 'Total days allocated for this leave type';
COMMENT ON COLUMN leave_balances.used_days IS 'Days already used (approved leaves)';
COMMENT ON COLUMN leave_balances.pending_days IS 'Days in pending leave requests';
COMMENT ON COLUMN leave_balances.carry_forward_days IS 'Days carried forward from previous year';

-- Success message
SELECT 'Leave management tables created successfully!' AS message;
