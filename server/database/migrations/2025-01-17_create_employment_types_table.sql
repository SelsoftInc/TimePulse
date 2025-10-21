-- Create employment_types lookup table
CREATE TABLE IF NOT EXISTS employment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- Insert default employment types for each tenant
INSERT INTO employment_types (tenant_id, name, description, is_active)
SELECT 
    t.id as tenant_id,
    'W2' as name,
    'Full-time employee with W2 tax classification' as description,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM employment_types et 
    WHERE et.tenant_id = t.id AND et.name = 'W2'
);

INSERT INTO employment_types (tenant_id, name, description, is_active)
SELECT 
    t.id as tenant_id,
    'Sub-Contract' as name,
    'Independent contractor or subcontractor' as description,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM employment_types et 
    WHERE et.tenant_id = t.id AND et.name = 'Sub-Contract'
);

-- Add employment_type_id to employees table
ALTER TABLE employees 
ADD COLUMN employment_type_id UUID REFERENCES employment_types(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employment_types_tenant_id ON employment_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type_id ON employees(employment_type_id);
