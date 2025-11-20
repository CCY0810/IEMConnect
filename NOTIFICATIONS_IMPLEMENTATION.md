# Notifications System Implementation

## Overview
A complete notifications system with in-app notifications, email support, and automatic data retention.

## Backend Implementation

### 1. Database Schema
- **Model**: `backend/models/Notification.js`
- **Table**: `notifications`
- **Fields**:
  - `id` (PK, auto-increment)
  - `user_id` (FK to users)
  - `title` (VARCHAR 255)
  - `message` (TEXT)
  - `is_read` (BOOLEAN, default: false)
  - `created_at` (DATETIME)
- **Indexes**: 
  - `idx_notifications_user_id` on `user_id`
  - `idx_notifications_created_at` on `created_at`
  - `idx_notifications_user_read` on `(user_id, is_read)`

### 2. Services
- **NotificationService** (`backend/services/notificationService.js`):
  - `notifyUser()` - Send notification to a single user
  - `notifyUsers()` - Send notifications to multiple users
  - `cleanupOldNotifications()` - Data retention (30 days default)
  - `getUnreadCount()` - Get unread count for a user

- **EmailService** (`backend/utils/emailService.js`):
  - Added `sendNotificationEmail()` method for sending notification emails

### 3. API Endpoints

#### User Endpoints (Authenticated)
- `GET /api/v1/notifications` - Get all notifications (with pagination)
- `GET /api/v1/notifications/unread-count` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark notification as read
- `PUT /api/v1/notifications/read-all` - Mark all notifications as read

#### Admin Endpoints
- `POST /api/v1/notifications` - Create a notification for a specific user
- `POST /api/v1/events/:id/announce` - Send announcement to all event participants

### 4. Data Retention
- **Cleanup Utility**: `backend/utils/cleanupNotifications.js`
- **Default Retention**: 30 days
- **Usage**: Run periodically (daily recommended) via cron job or scheduled task
- **Command**: `node backend/utils/cleanupNotifications.js`

## Frontend Implementation

### 1. API Client
- **File**: `frontend/lib/notification-api.ts`
- Functions:
  - `getNotifications(limit, offset)`
  - `getUnreadCount()`
  - `markAsRead(id)`
  - `markAllAsRead()`
  - `sendEventAnnouncement(eventId, subject, message, sendEmail)`

### 2. Notification Bell Component
- **File**: `frontend/components/NotificationBell.tsx`
- **Features**:
  - Badge showing unread count
  - Dropdown with recent notifications (last 20)
  - Click to mark as read
  - "Mark all as read" button
  - Auto-refresh every 30 seconds
  - Visual distinction between read/unread (blue background for unread)

### 3. Integration
- Added to headers in:
  - `frontend/app/dashboard/page.tsx`
  - `frontend/app/event/page.tsx`
  - `frontend/app/view_event/page.tsx`

### 4. Admin Announcement Feature
- **Location**: `frontend/app/view_event/page.tsx`
- **Features**:
  - Subject and message input fields
  - Checkbox to enable/disable email sending
  - Shows participant count
  - Success/error feedback
  - Sends to all registered participants of the event

## Database Migration

Run the SQL migration to create the notifications table:
```sql
-- File: backend/migrations/create_notifications_table.sql
```

Or let Sequelize auto-sync the model (models are auto-synced when imported).

## Setup Instructions

1. **Backend**:
   - The Notification model will be auto-synced when the server starts
   - Ensure email configuration is set in `.env`:
     ```
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     FRONTEND_URL=http://localhost:3000
     ```

2. **Data Retention**:
   - Set up a cron job or scheduled task to run cleanup daily:
     ```bash
     # Example cron job (runs daily at 2 AM)
     0 2 * * * cd /path/to/project && node backend/utils/cleanupNotifications.js
     ```

3. **Frontend**:
   - No additional setup required
   - Notification bell appears automatically in headers
   - Admin announcement feature is available on event management pages

## Usage Examples

### Send Announcement to Event Participants (Admin)
1. Navigate to an event's detail page
2. Scroll to "Send Announcement" section
3. Enter subject and message
4. Optionally enable/disable email sending
5. Click "Send to All Participants"

### View Notifications (User)
1. Click the bell icon in the header
2. View recent notifications in the dropdown
3. Click a notification to mark it as read
4. Use "Mark all read" to mark all as read

## Features

✅ In-app notifications with real-time updates
✅ Email notifications (optional)
✅ Unread count badge
✅ Mark as read functionality
✅ Data retention (30 days)
✅ Admin announcement system
✅ Event participant targeting
✅ Responsive UI with proper styling

