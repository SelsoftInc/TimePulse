-- Migration: Add employee_id, vendor_id, approved_by, and approved_at to invoices table
-- Date: 2025-11-08
-- Description: Adds missing columns to invoices table for proper invoice tracking

-- Step 1: Add columns
DO $$ 
BEGIN
    -- Add employee_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN employee_id UUID REFERENCES employees(id);
        RAISE NOTICE 'Added column: employee_id';
    ELSE
        RAISE NOTICE 'Column employee_id already exists';
    END IF;

    -- Add vendor_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'vendor_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN vendor_id UUID REFERENCES vendors(id);
        RAISE NOTICE 'Added column: vendor_id';
    ELSE
        RAISE NOTICE 'Column vendor_id already exists';
    END IF;

    -- Add approved_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE invoices ADD COLUMN approved_by UUID REFERENCES users(id);
        RAISE NOTICE 'Added column: approved_by';
    ELSE
        RAISE NOTICE 'Column approved_by already exists';
    END IF;

    -- Add approved_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE invoices ADD COLUMN approved_at TIMESTAMP;
        RAISE NOTICE 'Added column: approved_at';
    ELSE
        RAISE NOTICE 'Column approved_at already exists';
    END IF;
END $$;

-- Step 2: Add indexes (only after columns exist)
DO $$ 
BEGIN
    -- Create index on employee_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'invoices' AND indexname = 'idx_invoices_employee_id'
    ) THEN
        CREATE INDEX idx_invoices_employee_id ON invoices(employee_id);
        RAISE NOTICE 'Created index: idx_invoices_employee_id';
    ELSE
        RAISE NOTICE 'Index idx_invoices_employee_id already exists';
    END IF;

    -- Create index on vendor_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'invoices' AND indexname = 'idx_invoices_vendor_id'
    ) THEN
        CREATE INDEX idx_invoices_vendor_id ON invoices(vendor_id);
        RAISE NOTICE 'Created index: idx_invoices_vendor_id';
    ELSE
        RAISE NOTICE 'Index idx_invoices_vendor_id already exists';
    END IF;

    -- Create index on approved_by
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'invoices' AND indexname = 'idx_invoices_approved_by'
    ) THEN
        CREATE INDEX idx_invoices_approved_by ON invoices(approved_by);
        RAISE NOTICE 'Created index: idx_invoices_approved_by';
    ELSE
        RAISE NOTICE 'Index idx_invoices_approved_by already exists';
    END IF;
END $$;

-- Step 3: Backfill existing data
DO $$ 
BEGIN
    UPDATE invoices i
    SET 
        employee_id = t.employee_id,
        vendor_id = e.vendor_id
    FROM timesheets t
    LEFT JOIN employees e ON t.employee_id = e.id
    WHERE i.timesheet_id = t.id
        AND i.employee_id IS NULL;
    
    RAISE NOTICE 'Backfilled existing invoice data';
END $$;
