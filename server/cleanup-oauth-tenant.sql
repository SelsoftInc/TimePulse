-- Cleanup Script for OAuth Tenant Isolation Issue
-- This script removes the isolated tenant created for Chandralekha
-- and allows her to rejoin the correct Selsoft Inc tenant

-- Step 1: Find Chandralekha's current tenant
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  u.tenant_id,
  t.tenant_name,
  t.subdomain,
  e.id as employee_id
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN employees e ON e.user_id = u.id
WHERE u.email = 'chandralekha@selsoftinc.com';

-- Step 2: Find the correct Selsoft Inc tenant
SELECT 
  id as tenant_id,
  tenant_name,
  subdomain,
  created_at
FROM tenants
WHERE tenant_name LIKE '%Selsoft%' OR subdomain LIKE '%selsoft%'
ORDER BY created_at;

-- Step 3: Count users in Chandralekha's tenant (to verify it's safe to delete)
SELECT 
  t.id as tenant_id,
  t.tenant_name,
  COUNT(u.id) as user_count
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
WHERE t.tenant_name LIKE '%Chandralekha%' OR t.subdomain LIKE '%chandralekha%'
GROUP BY t.id, t.tenant_name;

-- Step 4: Delete Chandralekha's records (ONLY if she's the only user in that tenant)
-- IMPORTANT: Replace <chandralekha-user-id> with actual ID from Step 1

-- Delete employee record
-- DELETE FROM employees WHERE user_id = '<chandralekha-user-id>';

-- Delete user record
-- DELETE FROM users WHERE id = '<chandralekha-user-id>';

-- Delete isolated tenant (ONLY if it has no other users)
-- DELETE FROM tenants WHERE id = '<chandralekha-tenant-id>';

-- Step 5: Verify cleanup
SELECT 
  'Users' as table_name,
  COUNT(*) as count
FROM users
WHERE email = 'chandralekha@selsoftinc.com'
UNION ALL
SELECT 
  'Employees' as table_name,
  COUNT(*) as count
FROM employees e
JOIN users u ON e.user_id = u.id
WHERE u.email = 'chandralekha@selsoftinc.com';

-- Step 6: After cleanup, verify all users in Selsoft Inc tenant
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.auth_provider,
  e.department,
  t.tenant_name
FROM users u
LEFT JOIN employees e ON e.user_id = u.id
JOIN tenants t ON u.tenant_id = t.id
WHERE t.tenant_name LIKE '%Selsoft%'
ORDER BY u.created_at;

-- Expected result after fix:
-- All users with @selsoftinc.com should be in the same tenant
-- Chandralekha should NOT appear (will be re-created on next OAuth login)
