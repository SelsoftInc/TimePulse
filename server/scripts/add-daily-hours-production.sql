-- =============================================
-- Migration: Add Missing Timesheet Columns
-- Date: 2025-11-16
-- Description: Adds daily_hours, notes, attachments, reviewer_id columns
--              to timesheets table for production database
-- =============================================

-- Add daily_hours column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'daily_hours'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN daily_hours JSONB 
        DEFAULT '{"mon":0,"tue":0,"wed":0,"thu":0,"fri":0,"sat":0,"sun":0}'::jsonb;
        RAISE NOTICE 'Added daily_hours column';
    ELSE
        RAISE NOTICE 'Column daily_hours already exists';
    END IF;
END $$;

-- Add notes column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    ELSE
        RAISE NOTICE 'Column notes already exists';
    END IF;
END $$;

-- Add attachments column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'attachments'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN attachments JSONB 
        DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added attachments column';
    ELSE
        RAISE NOTICE 'Column attachments already exists';
    END IF;
END $$;

-- Add reviewer_id column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timesheets' 
        AND column_name = 'reviewer_id'
    ) THEN
        ALTER TABLE timesheets 
        ADD COLUMN reviewer_id UUID 
        REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added reviewer_id column';
    ELSE
        RAISE NOTICE 'Column reviewer_id already exists';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'timesheets'
AND column_name IN ('daily_hours', 'notes', 'attachments', 'reviewer_id')
ORDER BY column_name;

