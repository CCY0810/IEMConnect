-- Migration: Add user preferences JSON column to users table
-- Date: 2025-11-23
-- Description: Adds a JSON column to store all user preferences (notifications, privacy, app preferences)
-- This is cleaner than creating 20+ individual columns

USE IEM_CONNECT;

-- Add preferences JSON column
ALTER TABLE users
ADD COLUMN preferences JSON DEFAULT NULL AFTER reset_password_expiry;

-- Add 2FA enabled flag (for quick access without parsing JSON)
ALTER TABLE users
ADD COLUMN two_fa_enabled BOOLEAN DEFAULT FALSE AFTER two_fa_code_expiry;

-- Note: Default JSON values will be handled in the Sequelize model
-- MySQL JSON columns are efficient and support native JSON operations

