-- =====================================================
-- COMPREHENSIVE FIX FOR ALL MODULES
-- Date: 2026-01-05
-- Fixes: Database schema, foreign keys, phone columns
-- Modules: Employees, Vendors, Clients, Implementation Partners
-- =====================================================

-- =====================================================
-- 1. FIX IMPLEMENTATION PARTNERS TABLE
-- =====================================================

-- Ensure implementation_partners table exists with correct schema
CREATE TABLE IF NOT EXISTS implementation_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(500), -- Increased for encryption
  address JSONB DEFAULT '{}',
  category VARCHAR(50) DEFAULT 'implementation_partner',
  specialization VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_impl_partner_name_per_tenant UNIQUE (tenant_id, name)
);

-- Increase phone column size if it exists but is too small
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'implementation_partners' AND column_name = 'phone'
  ) THEN
    ALTER TABLE implementation_partners ALTER COLUMN phone TYPE VARCHAR(500);
  END IF;
END $$;

-- =====================================================
-- 2. FIX VENDORS TABLE
-- =====================================================

-- Increase phone column size for encryption
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'phone'
  ) THEN
    ALTER TABLE vendors ALTER COLUMN phone TYPE VARCHAR(500);
  END IF;
END $$;

-- =====================================================
-- 3. FIX CLIENTS TABLE (Already has VARCHAR(500))
-- =====================================================

-- Clients table already migrated to VARCHAR(500) in previous migration
-- Just verify it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'clients'
  ) THEN
    RAISE EXCEPTION 'Clients table does not exist!';
  END IF;
END $$;

-- =====================================================
-- 4. FIX EMPLOYEES TABLE
-- =====================================================

-- Add phone column to employees if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'phone'
  ) THEN
    ALTER TABLE employees ADD COLUMN phone VARCHAR(500);
  ELSE
    -- Increase size if exists
    ALTER TABLE employees ALTER COLUMN phone TYPE VARCHAR(500);
  END IF;
END $$;

-- Add client_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN client_id UUID NULL;
  END IF;
END $$;

-- Add vendor_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN vendor_id UUID NULL;
  END IF;
END $$;

-- Add impl_partner_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'impl_partner_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN impl_partner_id UUID NULL;
  END IF;
END $$;

-- =====================================================
-- 5. FIX FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Drop incorrect FK constraint if exists (references vendors instead of implementation_partners)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'impl_partner_id'
      AND tc.constraint_name = 'employees_impl_partner_id_fkey'
  ) THEN
    ALTER TABLE employees DROP CONSTRAINT employees_impl_partner_id_fkey;
  END IF;
END $$;

-- Add correct FK constraints
DO $$
BEGIN
  -- Client FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'client_id'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;

  -- Vendor FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'vendor_id'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  -- Implementation Partner FK (CORRECT REFERENCE)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'impl_partner_id'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_impl_partner_id_fkey
      FOREIGN KEY (impl_partner_id) REFERENCES implementation_partners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_employees_client_id ON employees(client_id);
CREATE INDEX IF NOT EXISTS idx_employees_vendor_id ON employees(vendor_id);
CREATE INDEX IF NOT EXISTS idx_employees_impl_partner_id ON employees(impl_partner_id);
CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone);

CREATE INDEX IF NOT EXISTS idx_vendors_phone ON vendors(phone);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_status ON vendors(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_status ON clients(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_impl_partners_phone ON implementation_partners(phone);
CREATE INDEX IF NOT EXISTS idx_impl_partners_tenant_status ON implementation_partners(tenant_id, status);

-- =====================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN employees.phone IS 'Employee Phone (encrypted, VARCHAR(500))';
COMMENT ON COLUMN vendors.phone IS 'Vendor Phone (encrypted, VARCHAR(500))';
COMMENT ON COLUMN clients.phone IS 'Client Phone (encrypted, VARCHAR(500))';
COMMENT ON COLUMN implementation_partners.phone IS 'Implementation partner Phone (encrypted, VARCHAR(500))';

COMMENT ON COLUMN employees.client_id IS 'Reference to client if employee works for a client';
COMMENT ON COLUMN employees.vendor_id IS 'Reference to vendor if employee is from a vendor';
COMMENT ON COLUMN employees.impl_partner_id IS 'Reference to implementation partner if employee is from an impl partner';

-- =====================================================
-- 8. VERIFY ALL TABLES EXIST
-- =====================================================

DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    missing_tables := array_append(missing_tables, 'employees');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendors') THEN
    missing_tables := array_append(missing_tables, 'vendors');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    missing_tables := array_append(missing_tables, 'clients');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'implementation_partners') THEN
    missing_tables := array_append(missing_tables, 'implementation_partners');
  END IF;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
  
  RAISE NOTICE '✅ All tables exist and have been updated successfully!';
  RAISE NOTICE '✅ Phone columns increased to VARCHAR(500) for encryption';
  RAISE NOTICE '✅ Foreign key constraints fixed';
  RAISE NOTICE '✅ Indexes created for performance';
END $$;
