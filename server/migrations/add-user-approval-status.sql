-- Migration: Add approval status fields to users table
-- For OAuth user approval workflow
-- Run this SQL script directly in your PostgreSQL database

-- Add approval_status column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' NOT NULL;

-- Add approved_by column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add approved_at column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add rejection_reason column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add foreign key constraint for approved_by (optional, may fail if data doesn't match)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_approved_by_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_approved_by_fkey 
        FOREIGN KEY (approved_by) REFERENCES users(id) 
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'rejection_reason')
ORDER BY column_name;

-- Show sample of updated table structure
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    status,
    approval_status,
    approved_by,
    approved_at
FROM users 
LIMIT 5;
