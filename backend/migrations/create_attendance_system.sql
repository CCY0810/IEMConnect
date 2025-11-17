USE IEM_CONNECT;

-- Add attendance columns to events table
ALTER TABLE events
ADD COLUMN attendance_code VARCHAR(8) DEFAULT NULL AFTER paperwork_file,
ADD COLUMN attendance_status ENUM('Pending', 'Active', 'Closed') NOT NULL DEFAULT 'Pending' AFTER attendance_code,
ADD COLUMN attendance_started_at DATETIME DEFAULT NULL AFTER attendance_status,
ADD COLUMN attendance_stopped_at DATETIME DEFAULT NULL AFTER attendance_started_at;

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  marked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  method ENUM('QR', 'Code', 'Manual') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
  
  -- Unique constraint: one attendance record per registration
  UNIQUE KEY unique_registration_attendance (registration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
