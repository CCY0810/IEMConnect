# Backend Integration - Event Management System

## ✅ Completed Implementation

### 1. **Database Model**

**File:** `backend/models/Event.js`

Created a comprehensive Event model with all required fields:

- Director information (name, matric, phone, email)
- Event details (title, description, cost, targeted_participants)
- Event dates (start_date, end_date)
- Status management (Upcoming/Open/Completed)
- File storage (poster_file, paperwork_file)
- Automatic timestamps (created_at, updated_at)

---

### 2. **API Endpoints**

**File:** `backend/routes/events.js`

Implemented full CRUD operations:

#### ✅ Public Endpoints (Authenticated users)

- `GET /api/v1/events` - List all events with search & filter
- `GET /api/v1/events/:id` - Get single event details
- `GET /api/v1/events/files/:filename` - Download files

#### ✅ Admin Endpoints

- `POST /api/v1/events` - Create new event
- `PUT /api/v1/events/:id` - Update event
- `DELETE /api/v1/events/:id` - Delete event

---

### 3. **File Upload System**

**File:** `backend/middleware/upload.js`

Implemented secure file handling:

- **Multer integration** for multipart/form-data
- **File validation** (images, PDFs, Word docs)
- **Size limit:** 10MB per file
- **Unique filenames** to prevent conflicts
- **Automatic cleanup** when updating/deleting events
- **Storage directory:** `backend/uploads/`

---

### 4. **Authentication & Authorization**

**File:** `backend/middleware/admin.js`

Added role-based access control:

- **Admin middleware** for protected endpoints
- **JWT verification** on all routes
- **Role checking** (admin/member)

---

### 5. **Business Logic**

**File:** `backend/controllers/eventController.js`

Implemented comprehensive controllers:

- ✅ `createEvent` - Create with file uploads
- ✅ `getEvents` - Search & filter support
- ✅ `getEventById` - Detailed event view
- ✅ `updateEvent` - Update with file replacement
- ✅ `deleteEvent` - Delete with file cleanup
- ✅ `getFile` - Secure file serving

**Features:**

- Input validation
- Error handling
- File URL generation
- Search by title/director
- Status filtering

---

### 6. **Placeholder Routes**

#### Reports (`backend/routes/reports.js`)

- `GET /api/v1/reports` - List reports
- `POST /api/v1/reports/generate` - Generate report

#### Attendance (`backend/routes/attendance.js`)

- `GET /api/v1/attendance` - List attendance
- `POST /api/v1/attendance/mark` - Mark attendance
- `GET /api/v1/attendance/event/:eventId` - Event attendance

#### Notifications (`backend/routes/notifications.js`)

- `GET /api/v1/notifications` - List notifications
- `POST /api/v1/notifications` - Create notification
- `PUT /api/v1/notifications/:id/read` - Mark as read

---

### 7. **Frontend Integration**

**File:** `frontend/lib/event-api.ts`

Created type-safe API client:

- TypeScript interfaces for Event data
- CRUD operations with proper typing
- File upload handling
- Error handling
- URL generation utilities

**Usage:**

```typescript
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "@/lib/event-api";

// Create event
await createEvent({
  director_name: "Dr. Farhan",
  title: "Engineering Summit 2025",
  start_date: "2025-02-20",
  end_date: "2025-02-21",
  poster_file: posterFile,
  paperwork_file: paperworkFile,
});

// Get events with search
const events = await getEvents({ search: "summit" });

// Get single event
const event = await getEventById(1);

// Update event
await updateEvent(1, { title: "New Title" });

// Delete event
await deleteEvent(1);
```

---

### 8. **Server Configuration**

**File:** `backend/server.js`

Updated server with new routes:

- Event routes: `/api/v1/events`
- Reports routes: `/api/v1/reports`
- Attendance routes: `/api/v1/attendance`
- Notifications routes: `/api/v1/notifications`

---

### 9. **Dependencies**

**File:** `backend/package.json`

Added required packages:

- `multer@^1.4.5-lts.1` - File upload handling

---

## 🎯 Database Schema

The Event model creates the following table:

```sql
events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  director_name VARCHAR(255) NOT NULL,
  director_matric VARCHAR(255) NOT NULL,
  director_phone VARCHAR(255) NOT NULL,
  director_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  targeted_participants VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('Upcoming','Open','Completed') DEFAULT 'Upcoming',
  poster_file VARCHAR(255),
  paperwork_file VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 📝 API Response Format

### Create/Update Success

```json
{
  "message": "Event created successfully",
  "event": {
    "id": 1,
    "director_name": "Dr. Farhan",
    "title": "Engineering Summit 2025",
    "poster_url": "/api/v1/events/files/poster_file-123.jpg",
    "paperwork_url": "/api/v1/events/files/paperwork_file-456.pdf"
  }
}
```

### List Events

```json
{
  "events": [
    {
      "id": 1,
      "title": "Engineering Summit 2025",
      "director_name": "Dr. Farhan",
      "status": "Upcoming",
      "poster_url": "/api/v1/events/files/poster_file-123.jpg"
    }
  ]
}
```

---

## 🔐 Authentication Requirements

### All Event Routes

- Require valid JWT token in Authorization header
- Token format: `Bearer <token>`

### Admin-Only Routes

- Create Event
- Update Event
- Delete Event
- All Reports endpoints
- All Attendance endpoints
- Create Notification

### Member Routes

- View all events
- View single event
- Download files
- View notifications

---

## 🚀 Next Steps for Frontend

To connect the frontend pages to the backend:

### 1. Update Create Event Page (`frontend/app/create_event/page.tsx`)

```typescript
import { createEvent } from "@/lib/event-api";

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  try {
    await createEvent({
      director_name: formData.directorName,
      director_matric: formData.matric,
      director_phone: formData.phone,
      director_email: formData.email,
      title: formData.title,
      description: formData.description,
      cost: parseFloat(formData.cost),
      targeted_participants: formData.targetedParticipants,
      start_date: formData.startDate,
      end_date: formData.endDate,
      poster_file: posterFile,
      paperwork_file: paperworkFile,
    });

    router.push("/event");
  } catch (error) {
    console.error("Failed to create event:", error);
  }
};
```

### 2. Update Event List Page (`frontend/app/event/page.tsx`)

```typescript
import { getEvents } from "@/lib/event-api";

useEffect(() => {
  const fetchEvents = async () => {
    try {
      const data = await getEvents({ search });
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  fetchEvents();
}, [search]);
```

### 3. Update View Event Page (`frontend/app/view_event/page.tsx`)

```typescript
import { getEventById, updateEvent } from "@/lib/event-api";

useEffect(() => {
  const fetchEvent = async () => {
    try {
      const data = await getEventById(eventId);
      setEvent(data);
    } catch (error) {
      console.error("Failed to fetch event:", error);
    }
  };

  fetchEvent();
}, [eventId]);

const handleUpdate = async () => {
  try {
    await updateEvent(eventId, updatedData);
    setEditing(false);
  } catch (error) {
    console.error("Failed to update event:", error);
  }
};
```

---

## ✨ Features Implemented

✅ Complete CRUD operations for events
✅ File upload & download (posters & paperwork)
✅ Search functionality (by title & director)
✅ Status filtering (Upcoming/Open/Completed)
✅ Role-based access control (Admin/Member)
✅ Automatic file cleanup on update/delete
✅ Type-safe frontend API client
✅ Comprehensive error handling
✅ Input validation
✅ URL generation for files
✅ Placeholder routes for future features

---

## 📚 Documentation

- **API Documentation:** `backend/API_DOCUMENTATION.md`
- **Backend Summary:** This file
- **Frontend API Client:** `frontend/lib/event-api.ts`

---

## 🛠 Testing the API

### Using curl:

```bash
# Login to get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Create event (admin)
curl -X POST http://localhost:5000/api/v1/events \
  -H "Authorization: Bearer <token>" \
  -F "director_name=Dr. Farhan" \
  -F "director_matric=A21MX1234" \
  -F "director_phone=012-3456789" \
  -F "director_email=farhan@utm.my" \
  -F "title=Engineering Summit 2025" \
  -F "start_date=2025-02-20" \
  -F "end_date=2025-02-21" \
  -F "poster_file=@poster.jpg" \
  -F "paperwork_file=@document.pdf"

# Get all events
curl http://localhost:5000/api/v1/events \
  -H "Authorization: Bearer <token>"

# Search events
curl "http://localhost:5000/api/v1/events?search=summit" \
  -H "Authorization: Bearer <token>"

# Get single event
curl http://localhost:5000/api/v1/events/1 \
  -H "Authorization: Bearer <token>"

# Update event (admin)
curl -X PUT http://localhost:5000/api/v1/events/1 \
  -H "Authorization: Bearer <token>" \
  -F "title=Updated Title"

# Delete event (admin)
curl -X DELETE http://localhost:5000/api/v1/events/1 \
  -H "Authorization: Bearer <token>"
```

---

## ⚠️ Important Notes

1. **Admin Access**: Only users with `role: "admin"` can create, update, or delete events
2. **File Size**: Maximum 10MB per file
3. **Supported Formats**:
   - Images: JPEG, PNG, GIF, WebP
   - Documents: PDF, DOC, DOCX
4. **Database**: Auto-syncs on server start (creates tables automatically)
5. **CORS**: Enabled for frontend integration
6. **Error Handling**: All endpoints return proper error messages

---

## 🎉 Summary

The backend is now fully functional and ready to be connected to the frontend. All required endpoints are implemented, tested, and documented. The frontend can now replace mock data with real API calls using the provided `event-api.ts` module.
