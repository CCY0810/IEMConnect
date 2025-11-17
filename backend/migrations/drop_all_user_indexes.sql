-- Drop ALL non-primary indexes from users table
-- This fixes the "Too many keys specified" error

USE IEM_CONNECT;

-- Get a list of all indexes
SELECT 
    INDEX_NAME
FROM 
    INFORMATION_SCHEMA.STATISTICS 
WHERE 
    TABLE_SCHEMA = 'IEM_CONNECT' 
    AND TABLE_NAME = 'users' 
    AND INDEX_NAME != 'PRIMARY';

-- Manually drop each index found
-- Run this script, check the output above, then uncomment and add DROP commands as needed

-- First, let's try a programmatic approach using a stored procedure
DELIMITER $$

DROP PROCEDURE IF EXISTS drop_all_user_indexes$$

CREATE PROCEDURE drop_all_user_indexes()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE idx_name VARCHAR(255);
    DECLARE cur CURSOR FOR 
        SELECT DISTINCT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = 'IEM_CONNECT' 
        AND TABLE_NAME = 'users' 
        AND INDEX_NAME != 'PRIMARY';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO idx_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET @drop_sql = CONCAT('ALTER TABLE users DROP INDEX `', idx_name, '`');
        PREPARE stmt FROM @drop_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;

    CLOSE cur;
END$$

DELIMITER ;

-- Execute the procedure to drop all indexes
CALL drop_all_user_indexes();

-- Now create only the two indexes we need
CREATE UNIQUE INDEX unique_email ON users(email);
CREATE UNIQUE INDEX unique_matric_number ON users(matric_number);

-- Clean up
DROP PROCEDURE IF EXISTS drop_all_user_indexes;
