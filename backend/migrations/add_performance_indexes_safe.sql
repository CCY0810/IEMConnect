-- Performance indexes for analytics and reports
-- MySQL Compatible Version (works with MySQL 5.6+)
-- This version uses a stored procedure to safely create indexes

USE IEM_CONNECT;

DELIMITER $$

-- Procedure to safely create an index (drops if exists, then creates)
DROP PROCEDURE IF EXISTS create_index_safe$$

CREATE PROCEDURE create_index_safe(
    IN table_name VARCHAR(255),
    IN index_name VARCHAR(255),
    IN columns VARCHAR(500)
)
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- Check if index exists
    SELECT COUNT(*) INTO index_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND INDEX_NAME = index_name;
    
    -- Drop if exists
    IF index_exists > 0 THEN
        SET @drop_sql = CONCAT('DROP INDEX `', index_name, '` ON `', table_name, '`');
        PREPARE stmt FROM @drop_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
    
    -- Create index
    SET @create_sql = CONCAT('CREATE INDEX `', index_name, '` ON `', table_name, '`(', columns, ')');
    PREPARE stmt FROM @create_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

-- Attendance table indexes
CALL create_index_safe('attendance', 'idx_attendance_marked_at', 'marked_at');
CALL create_index_safe('attendance', 'idx_attendance_method', 'method');
CALL create_index_safe('attendance', 'idx_attendance_registration_id', 'registration_id');

-- Event registrations indexes
CALL create_index_safe('event_registrations', 'idx_event_registration_status', 'status');
CALL create_index_safe('event_registrations', 'idx_event_registration_date', 'registration_date');
CALL create_index_safe('event_registrations', 'idx_event_registration_user_id', 'user_id');
CALL create_index_safe('event_registrations', 'idx_event_registration_event_id', 'event_id');

-- Users table indexes
CALL create_index_safe('users', 'idx_users_faculty', 'faculty');
CALL create_index_safe('users', 'idx_users_created_at', 'created_at');
CALL create_index_safe('users', 'idx_users_is_verified', 'is_verified');

-- Events table indexes
CALL create_index_safe('events', 'idx_events_status', 'status');
CALL create_index_safe('events', 'idx_events_start_date', 'start_date');
CALL create_index_safe('events', 'idx_events_created_at', 'created_at');

-- Composite indexes for common query patterns
CALL create_index_safe('attendance', 'idx_attendance_registration_marked_at', 'registration_id, marked_at');
CALL create_index_safe('event_registrations', 'idx_registration_user_event', 'user_id, event_id, status');

-- Clean up procedure
DROP PROCEDURE IF EXISTS create_index_safe;

