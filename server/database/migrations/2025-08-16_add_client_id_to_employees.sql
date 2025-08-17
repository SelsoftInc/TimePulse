-- Migration: Add client_id to employees table
-- Run this against your Postgres database used by the server.
-- Safe to run multiple times: uses IF NOT EXISTS guards.

DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE employees
      ADD COLUMN client_id UUID NULL;
  END IF;

  -- Add FK constraint if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
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

  -- Add index for lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'employees' AND indexname = 'idx_employees_client_id'
  ) THEN
    CREATE INDEX idx_employees_client_id ON employees(client_id);
  END IF;
END $$;
