-- Create implementation_partners table
-- This table stores information about implementation partner companies

CREATE TABLE IF NOT EXISTS implementation_partners (
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
  CONSTRAINT unique_impl_partner_name_per_tenant UNIQUE (tenant_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_impl_partners_tenant_id ON implementation_partners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_impl_partners_tenant_status ON implementation_partners(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_impl_partners_name ON implementation_partners(name);

-- Add comment to table
COMMENT ON TABLE implementation_partners IS 'Stores implementation partner company information';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Implementation partners table created successfully!';
END $$;
