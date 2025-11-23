-- =====================================================
-- IEM Connect - Complete Database Schema
-- =====================================================
-- This file contains the complete database schema for IEM Connect
-- It includes all tables, indexes, foreign keys, and constraints
-- Run this file to create a fresh database with all tables
-- 
-- Last Updated: 2025-11-23
-- Database: MySQL/MariaDB
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS iem_connect;
USE iem_connect;

-- =====================================================
-- TABLE: users
-- Description: Stores user accounts and profile information
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('member', 'admin') DEFAULT 'member',
  membership_number VARCHAR(6) NOT NULL,
  matric_number VARCHAR(9) NOT NULL,
  faculty ENUM(
    'Azman Hashim International Business School (AHIBS)',
    'Faculty of Artificial Intelligence (FAI)',
    'Faculty of Built Environment and Surveying',
    'Faculty of Chemical & Energy Engineering',
    'Faculty of Computing',
    'Faculty of Educational Sciences and Technology (FEST)',
    'Faculty of Electrical Engineering',
    'Faculty of Management',
    'Faculty of Mechanical Engineering',
    'Faculty of Science',
    'Faculty of Social Sciences and Humanities',
    'Malaysia-Japan International Institute of Technology (MJIIT)'
  ) NOT NULL,
  bio TEXT DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  two_fa_code_hash VARCHAR(255) DEFAULT NULL,
  two_fa_code_expiry DATETIME DEFAULT NULL,
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expiry DATETIME DEFAULT NULL,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  preferences JSON DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Unique constraints
  UNIQUE KEY unique_email (email),
  UNIQUE KEY unique_matric_number (matric_number),
  
  -- Indexes for performance
  INDEX idx_membership_number (membership_number),
  INDEX idx_users_faculty (faculty), -- For reports: faculty distribution queries (GROUP BY faculty)
  INDEX idx_role (role),
  INDEX idx_users_is_verified (is_verified), -- For reports: pending approvals queries (WHERE is_verified = 0)
  INDEX idx_users_created_at (created_at) -- For reports: user growth over time (WHERE createdAt <= date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: events
-- Description: Stores event information and details
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  director_name VARCHAR(255) NOT NULL,
  director_matric VARCHAR(255) NOT NULL,
  director_phone VARCHAR(255) NOT NULL,
  director_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  targeted_participants VARCHAR(255) DEFAULT NULL,
  start_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,
  end_date DATE NOT NULL,
  end_time TIME DEFAULT NULL,
  status ENUM('Upcoming', 'Open', 'Completed') DEFAULT 'Upcoming',
  poster_file VARCHAR(255) DEFAULT NULL,
  paperwork_file VARCHAR(255) DEFAULT NULL,
  attendance_code VARCHAR(8) DEFAULT NULL,
  attendance_status ENUM('Pending', 'Active', 'Closed') NOT NULL DEFAULT 'Pending',
  attendance_started_at DATETIME DEFAULT NULL,
  attendance_stopped_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_events_status (status), -- For reports: event status queries (GROUP BY status)
  INDEX idx_events_start_date (start_date), -- For reports: event date range queries (WHERE start_date BETWEEN)
  INDEX idx_end_date (end_date), -- For date range filtering
  INDEX idx_attendance_status (attendance_status),
  INDEX idx_attendance_code (attendance_code),
  INDEX idx_events_created_at (created_at), -- For reports: recent events, event growth over time
  INDEX idx_director_email (director_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: event_registrations
-- Description: Tracks user registrations for events
-- =====================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('registered', 'cancelled', 'attended') NOT NULL DEFAULT 'registered',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  
  -- Unique constraint: one user can only register once per event
  UNIQUE KEY unique_user_event_registration (user_id, event_id),
  
  -- Indexes for performance
  INDEX idx_event_registration_event_id (event_id),
  INDEX idx_event_registration_user_id (user_id),
  INDEX idx_event_registration_status (status),
  INDEX idx_event_registration_date (registration_date),
  -- Composite index for common query patterns
  INDEX idx_registration_user_event (user_id, event_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: attendance
-- Description: Records attendance for event registrations
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT NOT NULL,
  marked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  method ENUM('QR', 'Code', 'Manual') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
  
  -- Unique constraint: one attendance record per registration
  UNIQUE KEY unique_registration_attendance (registration_id),
  
  -- Indexes for performance
  INDEX idx_attendance_marked_at (marked_at),
  INDEX idx_attendance_method (method),
  INDEX idx_attendance_registration_id (registration_id),
  -- Composite index for common query patterns
  INDEX idx_attendance_registration_marked_at (registration_id, marked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: notifications
-- Description: Stores in-app notifications for users
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_created_at (created_at),
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
-- 
-- Summary of tables created:
-- 1. users - User accounts and profiles (with 2FA, password reset, verification)
-- 2. events - Event information (with attendance tracking)
-- 3. event_registrations - User event registrations (with status tracking)
-- 4. attendance - Attendance records (linked to registrations)
-- 5. notifications - User notifications (in-app messaging)
--
-- All foreign keys are set with ON DELETE CASCADE
-- All tables use InnoDB engine with utf8mb4 charset for full Unicode support
-- All timestamps use DATETIME with automatic defaults
--
-- Time Fields Included:
-- - Events: start_date, start_time, end_date, end_time, attendance_started_at, attendance_stopped_at
-- - Event Registrations: registration_date, created_at, updated_at
-- - Attendance: marked_at, created_at, updated_at
-- - Users: created_at, updated_at, two_fa_code_expiry, reset_password_expiry
-- - Notifications: created_at
--
-- Performance Indexes for Reports & Analytics:
-- Users Table:
--   - idx_users_faculty: For faculty distribution queries (GROUP BY faculty)
--   - idx_users_is_verified: For pending approvals queries (WHERE is_verified = 0)
--   - idx_users_created_at: For user growth over time (WHERE createdAt <= date)
--
-- Events Table:
--   - idx_events_status: For event status queries (GROUP BY status)
--   - idx_events_start_date: For event date range queries (WHERE start_date BETWEEN)
--   - idx_events_created_at: For recent events, event growth over time
--
-- Event Registrations Table:
--   - idx_event_registration_status: For filtering by registration status
--   - idx_event_registration_date: For time-based registration queries
--   - idx_registration_user_event: Composite index (user_id, event_id, status) for joins
--
-- Attendance Table:
--   - idx_attendance_marked_at: For time-based attendance queries
--   - idx_attendance_method: For method distribution queries (GROUP BY method)
--   - idx_attendance_registration_marked_at: Composite index for attendance time queries
--
-- Indexes included:
-- - Unique indexes: email, matric_number, user+event registration, registration attendance
-- - Performance indexes: All foreign keys, commonly queried fields, composite indexes for joins
-- - All indexes from add_performance_indexes.sql migration are included
-- - Full-text search ready: Can add FULLTEXT indexes on title, description, message fields if needed
--
-- =====================================================
