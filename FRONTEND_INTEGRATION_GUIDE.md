# Frontend Integration Guide

This guide shows you how to connect the frontend Event Management pages to the backend API.

## 📋 Prerequisites

1. Backend server running on `http://localhost:5000`
2. User authenticated with valid JWT token
3. Admin role for create/update/delete operations

---

## 🔧 Step-by-Step Integration

### Step 1: Update Create Event Page

**File:** `frontend/app/create_event/page.tsx`

Add state management and form submission:

```typescript
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createEvent } from "@/lib/event-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    directorName: "",
    matric: "",
    phone: "",
    email: "",
    title: "",
    description: "",
    cost: "",
    targetedParticipants: "",
    startDate: "",
    endDate: "",
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [paperworkFile, setPaperworkFile] = useState<File | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createEvent({
        director_name: formData.directorName,
        director_matric: formData.matric,
        director_phone: formData.phone,
        director_email: formData.email,
        title: formData.title,
        description: formData.description,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        targeted_participants: formData.targetedParticipants,
        start_date: formData.startDate,
        end_date: formData.endDate,
        poster_file: posterFile || undefined,
        paperwork_file: paperworkFile || undefined,
      });

      alert("Event created successfully!");
      router.push("/event");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create event");
      console.error("Create event error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component with form inputs bound to state

  return (
    <div>
      {/* ... existing UI ... */}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            {/* Director Name */}
            <Input
              value={formData.directorName}
              onChange={(e) =>
                setFormData({ ...formData, directorName: e.target.value })
              }
              placeholder="Enter director name"
              required
            />

            {/* ... other inputs ... */}

            {/* Poster Upload */}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
            />

            {/* Paperwork Upload */}
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setPaperworkFile(e.target.files?.[0] || null)}
            />
          </CardContent>
        </Card>

        {error && <p className="text-red-500">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Event"}
        </Button>
      </form>
    </div>
  );
}
```

---

### Step 2: Update Event List Page

**File:** `frontend/app/event/page.tsx`

Fetch and display real events:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getEvents, Event } from "@/lib/event-api";

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch events on mount and when search changes
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getEvents({ search });
        setEvents(data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch events");
        console.error("Fetch events error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [search]);

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
  };

  return (
    <div>
      {/* Search input */}
      <Input
        placeholder="Search event..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* Loading state */}
      {loading && <p>Loading events...</p>}

      {/* Error state */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Events table */}
      <Table>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.title}</TableCell>
              <TableCell>{event.director_name}</TableCell>
              <TableCell>
                {new Date(event.start_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <span className={getStatusClass(event.status)}>
                  {event.status}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => router.push(`/view_event?id=${event.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case "Upcoming":
      return "bg-blue-100 text-blue-600";
    case "Open":
      return "bg-green-100 text-green-700";
    case "Completed":
      return "bg-slate-200 text-slate-600";
    default:
      return "";
  }
}
```

---

### Step 3: Update View Event Page

**File:** `frontend/app/view_event/page.tsx`

Fetch single event and enable editing:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getEventById, updateEvent, Event } from "@/lib/event-api";

export default function ViewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const eventId = parseInt(searchParams.get("id") || "0");

  const [event, setEvent] = useState<Event | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    directorName: "",
    matric: "",
    phone: "",
    email: "",
    title: "",
    description: "",
    cost: "",
    targetedParticipants: "",
    startDate: "",
    endDate: "",
  });

  const [newPoster, setNewPoster] = useState<File | null>(null);
  const [newPaperwork, setNewPaperwork] = useState<File | null>(null);

  // Fetch event on mount
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const data = await getEventById(eventId);
        setEvent(data);

        // Populate form
        setFormData({
          directorName: data.director_name,
          matric: data.director_matric,
          phone: data.director_phone,
          email: data.director_email,
          title: data.title,
          description: data.description || "",
          cost: data.cost.toString(),
          targetedParticipants: data.targeted_participants || "",
          startDate: data.start_date,
          endDate: data.end_date,
        });
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch event");
        console.error("Fetch event error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleUpdate = async () => {
    setError("");
    setLoading(true);

    try {
      const updated = await updateEvent(eventId, {
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
        poster_file: newPoster || undefined,
        paperwork_file: newPaperwork || undefined,
      });

      setEvent(updated);
      setEditing(false);
      alert("Event updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update event");
      console.error("Update event error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!event) return <p>Event not found</p>;

  return (
    <div>
      {/* Display event details */}
      <Card>
        <CardContent>
          {editing ? (
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          ) : (
            <p>{event.title}</p>
          )}

          {/* Poster */}
          {event.poster_url && (
            <img
              src={`http://localhost:5000${event.poster_url}`}
              alt="Poster"
            />
          )}

          {/* Paperwork download */}
          {event.paperwork_url && (
            <a href={`http://localhost:5000${event.paperwork_url}`} download>
              Download Paperwork
            </a>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-red-500">{error}</p>}

      <Button onClick={() => (editing ? handleUpdate() : setEditing(true))}>
        {editing ? "Save Changes" : "Edit Event"}
      </Button>
    </div>
  );
}
```

---

## 🎯 Key Points

### 1. **Authentication**

All API calls automatically include the JWT token via the axios interceptor in `lib/api.ts`.

### 2. **File Uploads**

Use `File` objects from input elements:

```typescript
const [file, setFile] = useState<File | null>(null);

<Input
  type="file"
  onChange={(e) => setFile(e.target.files?.[0] || null)}
/>

await createEvent({ ..., poster_file: file || undefined });
```

### 3. **File URLs**

Backend returns relative URLs. Prepend base URL:

```typescript
const fullUrl = `http://localhost:5000${event.poster_url}`;
<img src={fullUrl} />;
```

### 4. **Search & Filter**

Pass query parameters:

```typescript
const events = await getEvents({
  search: "summit",
  status: "Upcoming",
});
```

### 5. **Error Handling**

Catch and display errors:

```typescript
try {
  await createEvent(data);
} catch (err: any) {
  setError(err.response?.data?.error || "An error occurred");
}
```

---

## 🚀 Testing Checklist

- [ ] Create a new event with files
- [ ] View all events
- [ ] Search for events
- [ ] Filter by status
- [ ] View single event details
- [ ] Update event information
- [ ] Update event files
- [ ] Download paperwork
- [ ] View poster image
- [ ] Delete event (admin only)

---

## 🔍 Debugging Tips

### Check Network Tab

1. Open DevTools → Network
2. Look for API calls to `/api/v1/events`
3. Check request payload and response

### Common Issues

**401 Unauthorized**

- Check if user is logged in
- Verify token in localStorage
- Check token expiration

**403 Forbidden**

- Verify user has admin role
- Check middleware configuration

**400 Bad Request**

- Validate required fields
- Check date format (YYYY-MM-DD)
- Verify file types

**500 Internal Server Error**

- Check backend console logs
- Verify database connection
- Check file permissions on uploads directory

---

## 📚 API Reference

Import the API functions:

```typescript
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  Event,
  CreateEventData,
  UpdateEventData,
} from "@/lib/event-api";
```

### Type Definitions

```typescript
interface Event {
  id: number;
  director_name: string;
  director_matric: string;
  director_phone: string;
  director_email: string;
  title: string;
  description?: string;
  cost: number;
  targeted_participants?: string;
  start_date: string;
  end_date: string;
  status: "Upcoming" | "Open" | "Completed";
  poster_file?: string;
  paperwork_file?: string;
  poster_url?: string;
  paperwork_url?: string;
  created_at?: string;
  updated_at?: string;
}
```

---

## ✅ Done!

Your frontend is now ready to be connected to the backend. Replace the mock data in each page with the API calls shown above, and your Event Management System will be fully functional!
