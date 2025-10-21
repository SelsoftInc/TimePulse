-- Add status field to invoices table for soft delete
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted'));

-- Update timesheet status enum to include 'deleted'
ALTER TABLE timesheets 
DROP CONSTRAINT IF EXISTS timesheets_status_check;

ALTER TABLE timesheets 
ADD CONSTRAINT timesheets_status_check 
CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'deleted'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Update existing records to have 'active' status
UPDATE invoices SET status = 'active' WHERE status IS NULL;
UPDATE timesheets SET status = 'draft' WHERE status IS NULL;
