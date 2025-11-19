-- Migration: Add 'approver' role to users_role enum
-- This script adds the 'approver' role to the existing enum type

-- For PostgreSQL: Add new value to enum
ALTER TYPE users_role ADD VALUE IF NOT EXISTS 'approver';

-- Alternative approach if the above doesn't work:
-- This creates a new enum type and migrates the data

-- Step 1: Create new enum type with all values including 'approver'
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_new') THEN
--         CREATE TYPE users_role_new AS ENUM ('admin', 'manager', 'approver', 'employee', 'accountant', 'hr');
--     END IF;
-- END $$;

-- Step 2: Alter the column to use the new type
-- ALTER TABLE users 
-- ALTER COLUMN role TYPE users_role_new 
-- USING role::text::users_role_new;

-- Step 3: Drop old enum and rename new one
-- DROP TYPE IF EXISTS users_role;
-- ALTER TYPE users_role_new RENAME TO users_role;

-- Verify the change
SELECT enum_range(NULL::users_role);
