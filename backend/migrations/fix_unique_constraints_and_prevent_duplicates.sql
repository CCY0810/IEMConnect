-- Fix unique constraints and prevent duplicate index creation
-- This migration ensures proper unique constraints exist and prevents Sequelize from creating duplicates
-- Run this AFTER cleaning up duplicate indexes

USE IEM_CONNECT;

-- Step 1: Verify and fix duplicate data (if any)
-- Check for duplicate emails
SELECT email, COUNT(*) as count 
FROM users 
GROUP BY email 
HAVING count > 1;

-- Check for duplicate matric numbers
SELECT matric_number, COUNT(*) as count 
FROM users 
GROUP BY matric_number 
HAVING count > 1;

-- If duplicates exist, you need to fix them manually before proceeding
-- Example fix (uncomment and modify as needed):
-- UPDATE users SET email = CONCAT(email, '_', id) WHERE id IN (SELECT id FROM (SELECT id FROM users WHERE email IN (SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1) LIMIT 1) AS t);

-- Step 2: Drop ALL existing indexes on email and matric_number (including duplicates)
-- This will remove email, email_2, email_3, etc. and matric_number, matric_number_2, etc.

DELIMITER $$

DROP PROCEDURE IF EXISTS drop_email_indexes$$
CREATE PROCEDURE drop_email_indexes()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE idx_name VARCHAR(255);
    DECLARE cur CURSOR FOR 
        SELECT DISTINCT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = 'IEM_CONNECT' 
          AND TABLE_NAME = 'users' 
          AND (INDEX_NAME LIKE 'email%' OR INDEX_NAME LIKE 'unique_email%')
          AND INDEX_NAME != 'PRIMARY';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO idx_name;
        IF done THEN LEAVE read_loop; END IF;
        SET @drop_sql = CONCAT('DROP INDEX `', idx_name, '` ON users');
        PREPARE stmt FROM @drop_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur;
END$$

DROP PROCEDURE IF EXISTS drop_matric_indexes$$
CREATE PROCEDURE drop_matric_indexes()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE idx_name VARCHAR(255);
    DECLARE cur CURSOR FOR 
        SELECT DISTINCT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = 'IEM_CONNECT' 
          AND TABLE_NAME = 'users' 
          AND (INDEX_NAME LIKE 'matric_number%' OR INDEX_NAME LIKE 'unique_matric_number%')
          AND INDEX_NAME != 'PRIMARY';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO idx_name;
        IF done THEN LEAVE read_loop; END IF;
        SET @drop_sql = CONCAT('DROP INDEX `', idx_name, '` ON users');
        PREPARE stmt FROM @drop_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur;
END$$

DELIMITER ;

-- Execute procedures to drop all duplicate indexes
CALL drop_email_indexes();
CALL drop_matric_indexes();

-- Step 3: Create ONLY the correct unique indexes with explicit names
-- These names match what Sequelize expects, preventing it from creating new ones
CREATE UNIQUE INDEX unique_email ON users(email);
CREATE UNIQUE INDEX unique_matric_number ON users(matric_number);

-- Step 4: Verify indexes
SHOW INDEXES FROM users WHERE Key_name IN ('unique_email', 'unique_matric_number');

-- Clean up procedures
DROP PROCEDURE IF EXISTS drop_email_indexes;
DROP PROCEDURE IF EXISTS drop_matric_indexes;

-- Step 5: Verify no duplicates remain
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(DISTINCT email) FROM users) as unique_emails,
    (SELECT COUNT(DISTINCT matric_number) FROM users) as unique_matric_numbers;

-- If total_users != unique_emails or total_users != unique_matric_numbers, you have duplicates that need to be fixed

