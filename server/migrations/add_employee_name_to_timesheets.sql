-- Migration: Add employee_name column to timesheets table
-- Purpose: Store employee name in timesheet for invoice generation
-- Date: 2025-11-25

-- Add employee_name column to timesheets table
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);

-- Add comment to column
COMMENT ON COLUMN timesheets.employee_name IS 'Employee full name stored for invoice generation';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_timesheets_employee_name ON timesheets(employee_name);

-- Update existing records with employee names from employees table
UPDATE timesheets t
SET employee_name = CONCAT(e.first_name, ' ', e.last_name)
FROM employees e
WHERE t.employee_id = e.id
AND t.employee_name IS NULL;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added employee_name column to timesheets table';
END $$;
