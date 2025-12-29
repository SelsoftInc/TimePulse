-- Migration: Add approver_id field to employees table
-- This field stores the user who approves this employee's timesheets and leave requests

-- Add approver_id column
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add comment
COMMENT ON COLUMN employees.approver_id IS 'User who approves this employee''s timesheets and leave requests';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_approver_id ON employees(approver_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'approver_id';
