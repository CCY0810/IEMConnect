import api from "./api";

// Get all user preferences
export const getUserPreferences = async () => {
  const response = await api.get("/auth/preferences");
  return response.data;
};

// Update user preferences (partial update - only send what changed)
export const updateUserPreferences = async (preferences: {
  notifications?: {
    email?: {
      reminders?: boolean;
      announcements?: boolean;
      registrations?: boolean;
      attendance?: boolean;
      system?: boolean;
      admin?: boolean;
    };
    in_app?: boolean;
    frequency?: "immediate" | "daily" | "weekly";
  };
  privacy?: {
    profile_visible?: boolean;
    email_visible?: boolean;
    data_sharing?: boolean;
  };
  app?: {
    theme?: "light" | "dark" | "system";
    date_format?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
    time_format?: "12h" | "24h";
  };
}) => {
  const response = await api.put("/auth/preferences", preferences);
  return response.data;
};

// 2FA Management
export const get2FAStatus = async () => {
  const response = await api.get("/auth/2fa");
  return response.data;
};

export const update2FA = async (enabled: boolean) => {
  const response = await api.put("/auth/2fa", { enabled });
  return response.data;
};

// Active Sessions
export const getActiveSessions = async () => {
  const response = await api.get("/auth/sessions");
  return response.data;
};

export const logoutSession = async (sessionId: string) => {
  const response = await api.delete(`/auth/sessions/${sessionId}`);
  return response.data;
};

// Export Data
export const exportUserData = async () => {
  const response = await api.get("/auth/export-data");
  return response.data;
};

// Admin System Stats
export const getAdminSystemStats = async () => {
  const response = await api.get("/auth/admin/system-stats");
  return response.data;
};

