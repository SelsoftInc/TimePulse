-- Migration: Create implementation_partners table and update employees table
-- Run this against your Postgres database used by the server.
-- Safe to run multiple times: uses IF NOT EXISTS guards.

DO $$
BEGIN
  -- Create implementation_partners table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'implementation_partners'
  ) THEN
    CREATE TABLE implementation_partners (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      legal_name VARCHAR(255),
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(20),
      address JSONB DEFAULT '{}',
      category VARCHAR(50) DEFAULT 'implementation_partner',
      specialization VARCHAR(255),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_tenant_name UNIQUE (tenant_id, name)
    );

    -- Create indexes
    CREATE INDEX idx_implementation_partners_tenant_status ON implementation_partners(tenant_id, status);
  END IF;

  -- Update employees table to reference implementation_partners instead of vendors for impl_partner_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'impl_partner_id'
  ) THEN
    -- Drop the existing foreign key constraint if it exists
    IF EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'employees'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'impl_partner_id'
    ) THEN
      ALTER TABLE employees DROP CONSTRAINT employees_impl_partner_id_fkey;
    END IF;

    -- Add the new foreign key constraint to implementation_partners
    ALTER TABLE employees
      ADD CONSTRAINT employees_impl_partner_id_fkey
      FOREIGN KEY (impl_partner_id) REFERENCES implementation_partners(id) ON DELETE SET NULL;
  END IF;
END $$;
