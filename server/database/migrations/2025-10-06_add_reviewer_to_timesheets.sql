-- =============================================
-- MIGRATION: Add reviewer_id to Timesheets Table
-- Date: 2025-10-06
-- Description: Adds reviewer assignment functionality to timesheets
-- =============================================

-- Add reviewer_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' AND column_name = 'reviewer_id'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added reviewer_id column to timesheets table';
    ELSE
        RAISE NOTICE 'reviewer_id column already exists in timesheets table';
    END IF;
END $$;

-- Create index for reviewer_id for better query performance
CREATE INDEX IF NOT EXISTS idx_timesheets_reviewer ON timesheets(reviewer_id);

RAISE NOTICE 'Migration completed successfully';
