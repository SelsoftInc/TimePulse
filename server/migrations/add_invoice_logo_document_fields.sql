-- Migration: Add company_logo, timesheet_file, and timesheet_file_name to invoices table
-- Date: 2025-11-24
-- Description: Adds columns to store company logo and timesheet document uploads for invoices

-- Step 1: Add columns
DO $$ 
BEGIN
    -- Add company_logo column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'company_logo'
    ) THEN
        ALTER TABLE invoices ADD COLUMN company_logo TEXT;
        RAISE NOTICE 'Added column: company_logo';
    ELSE
        RAISE NOTICE 'Column company_logo already exists';
    END IF;

    -- Add timesheet_file column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'timesheet_file'
    ) THEN
        ALTER TABLE invoices ADD COLUMN timesheet_file TEXT;
        RAISE NOTICE 'Added column: timesheet_file';
    ELSE
        RAISE NOTICE 'Column timesheet_file already exists';
    END IF;

    -- Add timesheet_file_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'timesheet_file_name'
    ) THEN
        ALTER TABLE invoices ADD COLUMN timesheet_file_name VARCHAR(255);
        RAISE NOTICE 'Added column: timesheet_file_name';
    ELSE
        RAISE NOTICE 'Column timesheet_file_name already exists';
    END IF;
END $$;

-- Step 2: Add comments to columns for documentation
COMMENT ON COLUMN invoices.company_logo IS 'Base64 encoded company logo image for invoice PDF';
COMMENT ON COLUMN invoices.timesheet_file IS 'Base64 encoded timesheet document attachment';
COMMENT ON COLUMN invoices.timesheet_file_name IS 'Original filename of the uploaded timesheet document';
