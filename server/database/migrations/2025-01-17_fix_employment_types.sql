-- Fix employment types: Replace 'hourly' with 'W2' and ensure proper employment type relationships

-- First, let's see what employment types exist
SELECT DISTINCT employment_type FROM employees WHERE employment_type IS NOT NULL;

-- Update employees with 'hourly' employment type to 'W2'
UPDATE employees 
SET employment_type = 'W2' 
WHERE employment_type = 'hourly';

-- Update employees with NULL employment type to 'W2' (default)
UPDATE employees 
SET employment_type = 'W2' 
WHERE employment_type IS NULL;

-- Verify the changes
SELECT DISTINCT employment_type FROM employees WHERE employment_type IS NOT NULL;
