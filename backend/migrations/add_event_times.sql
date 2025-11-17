-- Add start_time and end_time fields to events table
USE IEM_CONNECT;

ALTER TABLE events
ADD COLUMN start_time TIME NULL AFTER start_date,
ADD COLUMN end_time TIME NULL AFTER end_date;
