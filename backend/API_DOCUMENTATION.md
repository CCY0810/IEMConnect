# Event Management API - Backend Documentation

## Overview

This document describes the Event Management System backend API endpoints, including authentication requirements, request/response formats, and file handling.

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

All event endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Event Endpoints

### 1. Create Event

**Endpoint:** `POST /events`

**Authentication:** Required (Admin only)

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field                 | Type   | Required | Description                                                         |
| --------------------- | ------ | -------- | ------------------------------------------------------------------- |
| director_name         | string | Yes      | Full name of event director                                         |
| director_matric       | string | Yes      | Director's matric number                                            |
| director_phone        | string | Yes      | Director's phone number                                             |
| director_email        | string | Yes      | Director's email address                                            |
| title                 | string | Yes      | Event title                                                         |
| description           | string | No       | Event description                                                   |
| cost                  | number | No       | Event cost (default: 0)                                             |
| targeted_participants | string | No       | Target audience description                                         |
| start_date            | date   | Yes      | Event start date (YYYY-MM-DD)                                       |
| end_date              | date   | Yes      | Event end date (YYYY-MM-DD)                                         |
| status                | enum   | No       | Event status: "Upcoming", "Open", "Completed" (default: "Upcoming") |
| poster_file           | file   | No       | Event poster image                                                  |
| paperwork_file        | file   | No       | Event paperwork document                                            |

**Response:**

```json
{
  "message": "Event created successfully",
  "event": {
    "id": 1,
    "director_name": "Dr. Farhan",
    "director_matric": "A21MX1234",
    "director_phone": "012-3456789",
    "director_email": "farhan@utm.my",
    "title": "Engineering Summit 2025",
    "description": "A grand annual professional engineering event",
    "cost": 20.0,
    "targeted_participants": "300 engineering students",
    "start_date": "2025-02-20",
    "end_date": "2025-02-21",
    "status": "Upcoming",
    "poster_file": "poster_file-1234567890-123456789.jpg",
    "paperwork_file": "paperwork_file-1234567890-987654321.pdf",
    "created_at": "2025-11-17T10:30:00.000Z",
    "updated_at": "2025-11-17T10:30:00.000Z"
  }
}
```

---

### 2. Get All Events

**Endpoint:** `GET /events`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| search    | string | No       | Search by title or director name                  |
| status    | string | No       | Filter by status: "Upcoming", "Open", "Completed" |

**Example:**

```
GET /events?search=summit&status=Upcoming
```

**Response:**

```json
{
  "events": [
    {
      "id": 1,
      "director_name": "Dr. Farhan",
      "director_matric": "A21MX1234",
      "director_phone": "012-3456789",
      "director_email": "farhan@utm.my",
      "title": "Engineering Summit 2025",
      "description": "A grand annual professional engineering event",
      "cost": 20.0,
      "targeted_participants": "300 engineering students",
      "start_date": "2025-02-20",
      "end_date": "2025-02-21",
      "status": "Upcoming",
      "poster_file": "poster_file-1234567890-123456789.jpg",
      "paperwork_file": "paperwork_file-1234567890-987654321.pdf",
      "poster_url": "/api/v1/events/files/poster_file-1234567890-123456789.jpg",
      "paperwork_url": "/api/v1/events/files/paperwork_file-1234567890-987654321.pdf",
      "created_at": "2025-11-17T10:30:00.000Z",
      "updated_at": "2025-11-17T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Event by ID

**Endpoint:** `GET /events/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| id        | number | Yes      | Event ID    |

**Response:**

```json
{
  "event": {
    "id": 1,
    "director_name": "Dr. Farhan",
    "title": "Engineering Summit 2025",
    "poster_url": "/api/v1/events/files/poster_file-1234567890-123456789.jpg",
    "paperwork_url": "/api/v1/events/files/paperwork_file-1234567890-987654321.pdf"
  }
}
```

---

### 4. Update Event

**Endpoint:** `PUT /events/:id`

**Authentication:** Required (Admin only)

**Content-Type:** `multipart/form-data`

**Request Body:** Same fields as Create Event (all optional)

**Response:**

```json
{
  "message": "Event updated successfully",
  "event": {
    /* updated event object */
  }
}
```

---

### 5. Delete Event

**Endpoint:** `DELETE /events/:id`

**Authentication:** Required (Admin only)

**Response:**

```json
{
  "message": "Event deleted successfully"
}
```

---

### 6. Get File

**Endpoint:** `GET /events/files/:filename`

**Authentication:** Required

**Description:** Serves uploaded files (posters and paperwork)

---

## Placeholder Endpoints

### Reports

- `GET /reports` - Get all reports (admin only)
- `POST /reports/generate` - Generate a report (admin only)

### Attendance

- `GET /attendance` - Get all attendance records (admin only)
- `POST /attendance/mark` - Mark attendance (admin only)
- `GET /attendance/event/:eventId` - Get attendance for specific event (admin only)

### Notifications

- `GET /notifications` - Get all notifications
- `POST /notifications` - Create notification (admin only)
- `PUT /notifications/:id/read` - Mark notification as read

---

## File Upload

### Supported File Types

**Posters:**

- JPEG/JPG
- PNG
- GIF
- WebP

**Paperwork:**

- PDF
- DOC/DOCX

### File Size Limit

Maximum file size: **10MB**

### File Storage

Files are stored in `backend/uploads/` directory with unique filenames.

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized

```json
{
  "error": "No token provided"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied. Admin privileges required."
}
```

### 404 Not Found

```json
{
  "error": "Event not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create event",
  "details": "Error message details"
}
```

---

## Frontend Integration

Use the provided `frontend/lib/event-api.ts` module for type-safe API calls:

```typescript
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "@/lib/event-api";

// Create event
const event = await createEvent({
  director_name: "Dr. Farhan",
  director_matric: "A21MX1234",
  director_phone: "012-3456789",
  director_email: "farhan@utm.my",
  title: "Engineering Summit 2025",
  start_date: "2025-02-20",
  end_date: "2025-02-21",
  poster_file: posterFile,
  paperwork_file: paperworkFile,
});

// Get all events
const events = await getEvents({ search: "summit" });

// Get single event
const event = await getEventById(1);

// Update event
const updated = await updateEvent(1, { title: "New Title" });

// Delete event
await deleteEvent(1);
```

---

## Database Schema

### Events Table

```sql
CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  director_name VARCHAR(255) NOT NULL,
  director_matric VARCHAR(255) NOT NULL,
  director_phone VARCHAR(255) NOT NULL,
  director_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  targeted_participants VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Upcoming', 'Open', 'Completed') DEFAULT 'Upcoming',
  poster_file VARCHAR(255),
  paperwork_file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Setup Instructions

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables** in `backend/.env`:

   ```
   DB_NAME=iem_connect
   DB_USER=root
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=3306
   JWT_SECRET=your_secret_key
   ```

3. **Run the server:**

   ```bash
   npm run dev
   ```

4. **Database will auto-sync** on server start.

---

## Security Notes

- All file uploads are validated for type and size
- Admin-only endpoints are protected by `verifyAdmin` middleware
- Files are stored with unique names to prevent overwrites
- Old files are automatically deleted when updating events
