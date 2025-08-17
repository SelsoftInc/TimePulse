-- Migration: Add vendor_id and impl_partner_id to employees table
-- Safe to run multiple times

DO $$
BEGIN
  -- Add vendor_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE employees
      ADD COLUMN vendor_id UUID NULL;
  END IF;

  -- Add impl_partner_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'impl_partner_id'
  ) THEN
    ALTER TABLE employees
      ADD COLUMN impl_partner_id UUID NULL;
  END IF;

  -- Add FK constraint for vendor_id if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
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

  -- Add FK constraint for impl_partner_id if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = 'employees'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND kcu.column_name = 'impl_partner_id'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_impl_partner_id_fkey
      FOREIGN KEY (impl_partner_id) REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  -- Indexes for faster lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_vendor_id'
  ) THEN
    CREATE INDEX idx_employees_vendor_id ON employees(vendor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_impl_partner_id'
  ) THEN
    CREATE INDEX idx_employees_impl_partner_id ON employees(impl_partner_id);
  END IF;
END $$;
