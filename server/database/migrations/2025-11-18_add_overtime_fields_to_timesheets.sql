-- Migration: Add overtime fields to timesheets table
-- Date: 2025-11-18
-- Description: Adds overtime_comment and overtime_days columns to track overtime hours and employee explanations

-- Add overtime_comment column
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS overtime_comment TEXT;

-- Add overtime_days column (JSONB to store array of overtime days)
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS overtime_days JSONB;

-- Add comments for documentation
COMMENT ON COLUMN timesheets.overtime_comment IS 'Employee explanation for working overtime (>8 hours per day)';
COMMENT ON COLUMN timesheets.overtime_days IS 'JSON array of days with overtime: [{"day": "Monday", "hours": "9.5"}]';

-- Create index for faster queries on timesheets with overtime
CREATE INDEX IF NOT EXISTS idx_timesheets_overtime_comment ON timesheets(overtime_comment) WHERE overtime_comment IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added overtime_comment and overtime_days columns to timesheets table';
END $$;
