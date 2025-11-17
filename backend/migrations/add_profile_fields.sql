-- Migration: Add profile fields to users table
-- Date: 2025-11-17
-- Description: Adds matric_number, faculty, bio, and avatar_url fields to support enhanced profile management

USE IEM_CONNECT;

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN matric_number VARCHAR(9) UNIQUE NOT NULL AFTER membership_number,
ADD COLUMN faculty ENUM(
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
) NOT NULL AFTER matric_number,
ADD COLUMN bio TEXT DEFAULT NULL AFTER faculty,
ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL AFTER bio;

-- Add indexes for performance
CREATE INDEX idx_matric_number ON users(matric_number);
CREATE INDEX idx_faculty ON users(faculty);

-- Note: This migration requires all existing users to have matric_number and faculty values
-- If you have existing users, you need to populate these fields before running this migration
-- or temporarily make them nullable during migration
