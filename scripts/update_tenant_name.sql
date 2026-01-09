-- Update tenant name from 'selsoft' to 'Selsoft Inc.'
-- This script updates the tenant_name field in the tenants table

UPDATE tenants 
SET 
    tenant_name = 'Selsoft Inc.',
    updated_at = NOW()
WHERE 
    LOWER(tenant_name) = 'selsoft' 
    OR tenant_name = 'selsoft';

-- Verify the update
SELECT id, tenant_name, legal_name, subdomain, created_at, updated_at 
FROM tenants 
WHERE tenant_name = 'Selsoft Inc.';
