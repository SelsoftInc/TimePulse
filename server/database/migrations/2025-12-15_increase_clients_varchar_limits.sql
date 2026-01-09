-- Migration: Increase VARCHAR limits for encrypted data in clients table
-- Date: 2025-12-15
-- Reason: Encrypted data exceeds VARCHAR(50) limits for phone and tax_id fields

-- The phone and tax_id fields store encrypted data which is much longer than the original values
-- Encrypted strings are typically 3-4x longer than the original data
-- Increasing to VARCHAR(500) to accommodate encrypted data safely

ALTER TABLE clients 
  ALTER COLUMN phone TYPE VARCHAR(500);

ALTER TABLE clients 
  ALTER COLUMN tax_id TYPE VARCHAR(500);

-- Also update client_name, legal_name, contact_person, and email to match model definitions
ALTER TABLE clients 
  ALTER COLUMN client_name TYPE VARCHAR(500);

ALTER TABLE clients 
  ALTER COLUMN legal_name TYPE VARCHAR(500);

ALTER TABLE clients 
  ALTER COLUMN contact_person TYPE VARCHAR(500);

ALTER TABLE clients 
  ALTER COLUMN email TYPE VARCHAR(500);

-- Add comment to document the change
COMMENT ON COLUMN clients.phone IS 'Stores encrypted Phone (VARCHAR(500) to accommodate encryption)';
COMMENT ON COLUMN clients.tax_id IS 'Stores encrypted tax ID (VARCHAR(500) to accommodate encryption)';
