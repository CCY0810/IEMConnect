import api from "./api";

// Get current user profile
export const getProfile = async () => {
  const response = await api.get("/auth/verify-session");
  return response.data;
};

// Update user profile (only name can be updated)
export const updateProfile = async (name: string) => {
  const response = await api.put("/auth/profile", { name });
  return response.data;
};

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const response = await api.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};
