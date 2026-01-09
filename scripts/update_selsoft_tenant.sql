-- Update the specific tenant with subdomain 'selsoft' to 'Selsoft Inc.'
UPDATE tenants 
SET 
    tenant_name = 'Selsoft Inc.',
    updated_at = NOW()
WHERE 
    subdomain = 'selsoft' 
    AND id = '5eda5596-b1d9-4963-953d-7af9d0511ce8';

-- Verify the update
SELECT id, tenant_name, subdomain, updated_at 
FROM tenants 
WHERE subdomain = 'selsoft';
