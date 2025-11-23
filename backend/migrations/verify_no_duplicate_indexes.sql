-- Verification script to check for duplicate indexes
-- Run this to verify that duplicate indexes have been cleaned up

USE IEM_CONNECT;

-- Check for duplicate email indexes
SELECT 
    INDEX_NAME,
    COUNT(*) as count
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'IEM_CONNECT'
  AND TABLE_NAME = 'users'
  AND (INDEX_NAME LIKE 'email%' OR INDEX_NAME LIKE 'unique_email%')
  AND INDEX_NAME != 'PRIMARY'
GROUP BY INDEX_NAME
HAVING count > 0
ORDER BY INDEX_NAME;

-- Check for duplicate matric_number indexes
SELECT 
    INDEX_NAME,
    COUNT(*) as count
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'IEM_CONNECT'
  AND TABLE_NAME = 'users'
  AND (INDEX_NAME LIKE 'matric_number%' OR INDEX_NAME LIKE 'unique_matric_number%')
  AND INDEX_NAME != 'PRIMARY'
GROUP BY INDEX_NAME
HAVING count > 0
ORDER BY INDEX_NAME;

-- Show all indexes on users table
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'IEM_CONNECT'
  AND TABLE_NAME = 'users'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Count total indexes (should be reasonable, not near 64)
SELECT 
    COUNT(DISTINCT INDEX_NAME) as total_indexes
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'IEM_CONNECT'
  AND TABLE_NAME = 'users'
  AND INDEX_NAME != 'PRIMARY';

-- Expected result: Should only see:
-- - PRIMARY (on id)
-- - unique_email (on email)
-- - unique_matric_number (on matric_number)
-- - Any other indexes you've explicitly created via migrations

