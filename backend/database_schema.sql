-- =====================================================
-- IEM Connect - Complete Database Schema
-- =====================================================
-- This file contains the complete database schema for IEM Connect
-- It includes all tables, indexes, foreign keys, and constraints
-- Run this file to create a fresh database with all tables
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Unique constraints
  UNIQUE KEY unique_email (email),
  UNIQUE KEY unique_matric_number (matric_number),
  
  -- Indexes for performance
  INDEX idx_membership_number (membership_number),
  INDEX idx_faculty (faculty),
  INDEX idx_role (role),
  INDEX idx_is_verified (is_verified)
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
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_attendance_status (attendance_status),
  INDEX idx_attendance_code (attendance_code)
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
  INDEX idx_event_id (event_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_registration_date (registration_date)
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
  INDEX idx_marked_at (marked_at),
  INDEX idx_method (method)
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
-- 1. users - User accounts and profiles
-- 2. events - Event information
-- 3. event_registrations - User event registrations
-- 4. attendance - Attendance records
-- 5. notifications - User notifications
--
-- All foreign keys are set with ON DELETE CASCADE
-- All tables use InnoDB engine with utf8mb4 charset
-- =====================================================

