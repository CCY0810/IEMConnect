-- =====================================================
-- IEM Connect - TiDB Cloud Compatible Schema
-- =====================================================
-- Run this in TiDB SQL Editor
-- First, create a new database and select it
-- =====================================================

-- Create database (run this first)
CREATE DATABASE IF NOT EXISTS iem_connect;

-- =====================================================
-- After creating the database, click on it in the left panel
-- or run: USE iem_connect;
-- Then run the table creation statements below
-- =====================================================

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  membership_number VARCHAR(6) NOT NULL,
  matric_number VARCHAR(9) NOT NULL,
  faculty VARCHAR(100) NOT NULL,
  bio TEXT DEFAULT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  two_fa_code_hash VARCHAR(255) DEFAULT NULL,
  two_fa_code_expiry DATETIME DEFAULT NULL,
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expiry DATETIME DEFAULT NULL,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  preferences JSON DEFAULT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email),
  UNIQUE KEY unique_membership_number (membership_number),
  UNIQUE KEY unique_matric_number (matric_number),
  INDEX idx_membership_number (membership_number),
  INDEX idx_users_faculty (faculty),
  INDEX idx_role (role),
  INDEX idx_users_is_verified (is_verified),
  INDEX idx_users_created_at (createdAt)
);

-- TABLE: events
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
  status VARCHAR(20) DEFAULT 'Upcoming',
  poster_file VARCHAR(255) DEFAULT NULL,
  paperwork_file VARCHAR(255) DEFAULT NULL,
  attendance_code VARCHAR(8) DEFAULT NULL,
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  attendance_started_at DATETIME DEFAULT NULL,
  attendance_stopped_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_status (status),
  INDEX idx_events_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_attendance_status (attendance_status),
  INDEX idx_attendance_code (attendance_code),
  INDEX idx_events_created_at (created_at),
  INDEX idx_director_email (director_email)
);

-- TABLE: event_registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'registered',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_event_registration (user_id, event_id),
  INDEX idx_event_registration_event_id (event_id),
  INDEX idx_event_registration_user_id (user_id),
  INDEX idx_event_registration_status (status),
  INDEX idx_event_registration_date (registration_date),
  INDEX idx_registration_user_event (user_id, event_id, status)
);

-- TABLE: attendance
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_id INT NOT NULL,
  marked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  method VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_registration_attendance (registration_id),
  INDEX idx_attendance_marked_at (marked_at),
  INDEX idx_attendance_method (method),
  INDEX idx_attendance_registration_id (registration_id),
  INDEX idx_attendance_registration_marked_at (registration_id, marked_at)
);

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_created_at (created_at),
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_is_read (is_read)
);

-- TABLE: feedback
CREATE TABLE IF NOT EXISTS feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_event_feedback (user_id, event_id),
  INDEX idx_feedback_event_id (event_id),
  INDEX idx_feedback_user_id (user_id),
  INDEX idx_feedback_created_at (created_at),
  INDEX idx_feedback_rating (rating)
);

-- Verify tables were created
SHOW TABLES;
