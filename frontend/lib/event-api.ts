import api from "./api";

export interface Event {
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

export interface CreateEventData {
  director_name: string;
  director_matric: string;
  director_phone: string;
  director_email: string;
  title: string;
  description?: string;
  cost?: number;
  targeted_participants?: string;
  start_date: string;
  end_date: string;
  status?: "Upcoming" | "Open" | "Completed";
  poster_file?: File;
  paperwork_file?: File;
}

export interface UpdateEventData extends Partial<CreateEventData> {}

// Create a new event
export const createEvent = async (data: CreateEventData): Promise<Event> => {
  const formData = new FormData();

  // Append all fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await api.post("/events", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.event;
};

// Get all events with optional search
export const getEvents = async (params?: {
  search?: string;
  status?: string;
}): Promise<Event[]> => {
  const response = await api.get("/events", { params });
  return response.data.events;
};

// Get event by ID
export const getEventById = async (id: number): Promise<Event> => {
  const response = await api.get(`/events/${id}`);
  return response.data.event;
};

// Update event
export const updateEvent = async (
  id: number,
  data: UpdateEventData
): Promise<Event> => {
  const formData = new FormData();

  // Append all fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  const response = await api.put(`/events/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.event;
};

// Delete event
export const deleteEvent = async (id: number): Promise<void> => {
  await api.delete(`/events/${id}`);
};

// Get file URL
export const getFileUrl = (filename: string): string => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  return `${baseUrl}/events/files/${filename}`;
};
