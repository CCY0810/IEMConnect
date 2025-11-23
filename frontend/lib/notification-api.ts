import api from "./api";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
  total: number;
}

// Get all notifications for the logged-in user
export const getNotifications = async (
  limit: number = 50,
  offset: number = 0
): Promise<NotificationResponse> => {
  const response = await api.get("/notifications", {
    params: { limit, offset },
  });
  // Handle both response formats
  if (response.data.notifications) {
    return response.data;
  }
  // If response is just an array, wrap it
  return {
    notifications: Array.isArray(response.data) ? response.data : [],
    unread_count: 0,
    total: Array.isArray(response.data) ? response.data.length : 0,
  };
};

// Get unread notification count
export const getUnreadCount = async (): Promise<{ unread_count: number }> => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

// Mark a notification as read
export const markAsRead = async (id: number): Promise<{ notification: Notification }> => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<{ updated_count: number }> => {
  const response = await api.put("/notifications/read-all");
  return response.data;
};

// Send announcement to event participants (admin only)
export const sendEventAnnouncement = async (
  eventId: number,
  subject: string,
  message: string,
  sendEmail: boolean = true
): Promise<{
  message: string;
  event: { id: number; title: string };
  sent: number;
  failed: number;
  total: number;
}> => {
  const response = await api.post(`/events/${eventId}/announce`, {
    subject,
    message,
    sendEmail,
  });
  return response.data;
};

