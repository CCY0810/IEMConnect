-- =====================================================
-- Migration: Create Feedback Table
-- Description: Stores participant feedback for events
-- =====================================================

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  
  -- One feedback per user per event
  UNIQUE KEY unique_user_event_feedback (user_id, event_id),
  
  -- Indexes for performance
  INDEX idx_feedback_event_id (event_id),
  INDEX idx_feedback_user_id (user_id),
  INDEX idx_feedback_created_at (created_at),
  INDEX idx_feedback_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add check constraint for rating (MySQL 8.0.16+)
-- For older MySQL versions, this will be enforced at the application level
-- ALTER TABLE feedback ADD CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5);

-- Verify table creation
SELECT 'Feedback table created successfully' AS status;
