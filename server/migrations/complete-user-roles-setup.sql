-- =====================================================
-- Complete User Roles Setup Migration
-- This script does everything needed to fix the user management issue
-- =====================================================

-- Step 1: Add 'approver' to the enum type if it doesn't exist
DO $$
BEGIN
    -- Check if 'approver' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'enum_users_role' 
        AND e.enumlabel = 'approver'
    ) THEN
        -- Add 'approver' to the enum
        ALTER TYPE enum_users_role ADD VALUE 'approver' AFTER 'manager';
        RAISE NOTICE '✅ Added "approver" to enum_users_role';
    ELSE
        RAISE NOTICE '⏭️  "approver" already exists in enum_users_role';
    END IF;
END $$;

-- Step 2: Verify the enum values
SELECT 'Current enum values:' as message;
SELECT enumlabel as role_value 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'enum_users_role'
ORDER BY e.enumsortorder;

-- Step 3: Create lookups table if it doesn't exist
CREATE TABLE IF NOT EXISTS lookups (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    value VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tenant_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, code)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_lookups_category_code ON lookups(category, code);
CREATE INDEX IF NOT EXISTS idx_lookups_category_active ON lookups(category, is_active);
CREATE INDEX IF NOT EXISTS idx_lookups_tenant ON lookups(tenant_id);

-- Step 4: Insert user roles into lookups table
INSERT INTO lookups (category, code, label, display_order, is_active, tenant_id)
VALUES 
    ('user_role', 'admin', 'Admin', 1, true, NULL),
    ('user_role', 'manager', 'Manager', 2, true, NULL),
    ('user_role', 'approver', 'Approver', 3, true, NULL),
    ('user_role', 'employee', 'Employee', 4, true, NULL),
    ('user_role', 'accountant', 'Accountant', 5, true, NULL),
    ('user_role', 'hr', 'HR', 6, true, NULL)
ON CONFLICT (category, code) 
DO UPDATE SET 
    label = EXCLUDED.label,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Step 5: Verify the inserted roles
SELECT 'Roles in lookups table:' as message;
SELECT id, code, label, display_order, is_active
FROM lookups
WHERE category = 'user_role'
ORDER BY display_order;

-- Step 6: Check if there are any users with invalid roles
SELECT 'Users with roles:' as message;
SELECT id, first_name, last_name, email, role
FROM users
ORDER BY role;

-- Success message
SELECT '✅ Migration completed successfully!' as message;
SELECT '✅ Enum updated with "approver" role' as message;
SELECT '✅ Lookups table populated with all roles' as message;
SELECT '🎉 You can now restart your server and test!' as message;
