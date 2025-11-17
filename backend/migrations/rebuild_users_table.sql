-- Rebuild users table to fix index overflow issue
USE IEM_CONNECT;

-- Backup existing data
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Drop and recreate the users table with proper indexes
DROP TABLE IF EXISTS users;

CREATE TABLE users (
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
  bio TEXT,
  avatar_url VARCHAR(255),
  is_verified TINYINT DEFAULT 0,
  two_fa_code_hash VARCHAR(255),
  two_fa_code_expiry DATETIME,
  reset_password_token VARCHAR(255),
  reset_password_expiry DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Only create the essential indexes
  UNIQUE KEY unique_email (email),
  UNIQUE KEY unique_matric_number (matric_number)
);

-- Restore data from backup
INSERT INTO users SELECT * FROM users_backup;

-- Drop backup table
DROP TABLE users_backup;
