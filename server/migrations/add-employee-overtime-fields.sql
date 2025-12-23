-- Migration: Add overtime and additional fields to employees table
-- Run this SQL in your PostgreSQL database

-- Add overtime_rate column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(10, 2);

-- Add enable_overtime column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS enable_overtime BOOLEAN DEFAULT false;

-- Add overtime_multiplier column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS overtime_multiplier DECIMAL(3, 2) DEFAULT 1.5;

-- Add approver column (references users table)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS approver UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add notes column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('overtime_rate', 'enable_overtime', 'overtime_multiplier', 'approver', 'notes')
ORDER BY column_name;
