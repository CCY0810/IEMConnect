import api from "./api";

// Check if event can be started (admin only)
export const canStartEvent = async (eventId: number) => {
  const response = await api.get(`/attendance/events/${eventId}/can-start`);
  return response.data;
};

// Start attendance (admin only)
export const startAttendance = async (eventId: number) => {
  const response = await api.post(`/attendance/events/${eventId}/start`);
  return response.data;
};

// Stop attendance (admin only)
export const stopAttendance = async (eventId: number) => {
  const response = await api.post(`/attendance/events/${eventId}/stop`);
  return response.data;
};

// Get attendance list (admin only)
export const getAttendanceList = async (eventId: number) => {
  const response = await api.get(`/attendance/events/${eventId}/list`);
  return response.data;
};

// Student check-in (only needs code, backend finds event)
export const checkInToEvent = async (code: string, method: string = "Code") => {
  const response = await api.post("/attendance/check-in", {
    code,
    method,
  });
  return response.data;
};
