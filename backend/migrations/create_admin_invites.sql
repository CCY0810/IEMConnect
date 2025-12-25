-- Admin Invites Table Migration
-- Creates the admin_invites table for tracking admin invitations

CREATE TABLE IF NOT EXISTS admin_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_by INT NOT NULL,
  used_at DATETIME NULL,
  used_by INT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_created_by (created_by),
  INDEX idx_expires_at (expires_at),
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- To run this migration:
-- 1. Connect to your MySQL database
-- 2. Run: source migrations/create_admin_invites.sql
-- Or copy and paste the CREATE TABLE statement directly into your MySQL client
