-- Cleanup script to remove duplicate indexes on users table
-- This fixes the "Too many keys specified; max 64 keys allowed" error

USE IEM_CONNECT;

-- First, let's see what indexes we have
-- Run: SHOW INDEXES FROM users;

-- Drop all duplicate/auto-generated unique indexes on email
-- Keep only the named one we want
DROP INDEX IF EXISTS email ON users;
DROP INDEX IF EXISTS email_2 ON users;
DROP INDEX IF EXISTS email_3 ON users;
DROP INDEX IF EXISTS email_4 ON users;
DROP INDEX IF EXISTS email_5 ON users;
DROP INDEX IF EXISTS email_6 ON users;
DROP INDEX IF EXISTS email_7 ON users;
DROP INDEX IF EXISTS email_8 ON users;
DROP INDEX IF EXISTS email_9 ON users;
DROP INDEX IF EXISTS email_10 ON users;

-- Drop duplicate matric_number indexes
DROP INDEX IF EXISTS matric_number ON users;
DROP INDEX IF EXISTS matric_number_2 ON users;
DROP INDEX IF EXISTS matric_number_3 ON users;
DROP INDEX IF EXISTS matric_number_4 ON users;
DROP INDEX IF EXISTS matric_number_5 ON users;

-- Create only the two indexes we need with explicit names
CREATE UNIQUE INDEX IF NOT EXISTS unique_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS unique_matric_number ON users(matric_number);
