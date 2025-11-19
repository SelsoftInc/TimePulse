-- ============================================
-- CLEANUP DUPLICATE EMPLOYEES
-- ============================================
-- This script identifies and removes duplicate employees
-- keeping only the oldest record for each duplicate

-- Step 1: Identify duplicates
-- ============================================
SELECT 
    "firstName",
    "lastName",
    "email",
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY "createdAt" ASC) as employee_ids,
    array_agg("hourlyRate") as hourly_rates,
    array_agg("createdAt" ORDER BY "createdAt" ASC) as created_dates
FROM employees
WHERE "tenantId" = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
GROUP BY "firstName", "lastName", "email"
HAVING COUNT(*) > 1
ORDER BY "firstName", "lastName";

-- Step 2: Preview what will be deleted
-- ============================================
-- This shows which records will be KEPT (oldest) and which will be DELETED (newer)
WITH ranked_employees AS (
    SELECT 
        id,
        "firstName",
        "lastName",
        "email",
        "hourlyRate",
        "createdAt",
        ROW_NUMBER() OVER (
            PARTITION BY "firstName", "lastName", "email", "tenantId" 
            ORDER BY "createdAt" ASC
        ) as row_num
    FROM employees
    WHERE "tenantId" = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
)
SELECT 
    id,
    "firstName",
    "lastName",
    "email",
    "hourlyRate",
    "createdAt",
    CASE 
        WHEN row_num = 1 THEN '✅ KEEP (oldest)'
        ELSE '❌ DELETE (duplicate)'
    END as action
FROM ranked_employees
WHERE id IN (
    SELECT id 
    FROM ranked_employees 
    WHERE row_num > 1
    UNION
    SELECT id
    FROM ranked_employees
    WHERE row_num = 1
    AND id IN (
        SELECT MIN(id)
        FROM ranked_employees
        GROUP BY "firstName", "lastName", "email"
        HAVING COUNT(*) > 1
    )
)
ORDER BY "firstName", "lastName", "createdAt";

-- Step 3: DELETE DUPLICATES (KEEP OLDEST)
-- ============================================
-- ⚠️ WARNING: This will permanently delete duplicate records!
-- ⚠️ Make sure to backup your database before running this!

-- Uncomment the following lines to execute the deletion:

/*
DELETE FROM employees
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY "firstName", "lastName", "email", "tenantId" 
                ORDER BY "createdAt" ASC
            ) as row_num
        FROM employees
        WHERE "tenantId" = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
    ) ranked
    WHERE row_num > 1
);
*/

-- Step 4: Verify cleanup
-- ============================================
-- After deletion, run this to verify no duplicates remain
/*
SELECT 
    "firstName",
    "lastName",
    "email",
    COUNT(*) as count
FROM employees
WHERE "tenantId" = '5eda5596-b1d9-4963-953d-7af9d0511ce8'
GROUP BY "firstName", "lastName", "email"
HAVING COUNT(*) > 1;
*/

-- Expected result: No rows (all duplicates removed)

-- Step 5: Count remaining employees
-- ============================================
/*
SELECT COUNT(*) as total_employees
FROM employees
WHERE "tenantId" = '5eda5596-b1d9-4963-953d-7af9d0511ce8';
*/
