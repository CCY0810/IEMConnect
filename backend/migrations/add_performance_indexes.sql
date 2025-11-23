-- Performance indexes for analytics and reports
-- Run this migration to optimize query performance
-- MySQL Compatible Version (requires MySQL 5.7.4+ for DROP INDEX IF EXISTS)
-- 
-- If you have MySQL 5.6 or older, use add_performance_indexes_safe.sql instead

USE IEM_CONNECT;

-- Attendance table indexes
-- Drop if exists, then create (safe for MySQL)
DROP INDEX IF EXISTS idx_attendance_marked_at ON attendance;
CREATE INDEX idx_attendance_marked_at ON attendance(marked_at);

DROP INDEX IF EXISTS idx_attendance_method ON attendance;
CREATE INDEX idx_attendance_method ON attendance(method);

DROP INDEX IF EXISTS idx_attendance_registration_id ON attendance;
CREATE INDEX idx_attendance_registration_id ON attendance(registration_id);

-- Event registrations indexes
DROP INDEX IF EXISTS idx_event_registration_status ON event_registrations;
CREATE INDEX idx_event_registration_status ON event_registrations(status);

DROP INDEX IF EXISTS idx_event_registration_date ON event_registrations;
CREATE INDEX idx_event_registration_date ON event_registrations(registration_date);

DROP INDEX IF EXISTS idx_event_registration_user_id ON event_registrations;
CREATE INDEX idx_event_registration_user_id ON event_registrations(user_id);

DROP INDEX IF EXISTS idx_event_registration_event_id ON event_registrations;
CREATE INDEX idx_event_registration_event_id ON event_registrations(event_id);

-- Users table indexes
DROP INDEX IF EXISTS idx_users_faculty ON users;
CREATE INDEX idx_users_faculty ON users(faculty);

DROP INDEX IF EXISTS idx_users_created_at ON users;
CREATE INDEX idx_users_created_at ON users(created_at);

DROP INDEX IF EXISTS idx_users_is_verified ON users;
CREATE INDEX idx_users_is_verified ON users(is_verified);

-- Events table indexes
DROP INDEX IF EXISTS idx_events_status ON events;
CREATE INDEX idx_events_status ON events(status);

DROP INDEX IF EXISTS idx_events_start_date ON events;
CREATE INDEX idx_events_start_date ON events(start_date);

DROP INDEX IF EXISTS idx_events_created_at ON events;
CREATE INDEX idx_events_created_at ON events(created_at);

-- Composite indexes for common query patterns
DROP INDEX IF EXISTS idx_attendance_registration_marked_at ON attendance;
CREATE INDEX idx_attendance_registration_marked_at ON attendance(registration_id, marked_at);

DROP INDEX IF EXISTS idx_registration_user_event ON event_registrations;
CREATE INDEX idx_registration_user_event ON event_registrations(user_id, event_id, status);

