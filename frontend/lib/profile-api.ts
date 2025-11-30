import api from "./api";

// Get current user profile
export const getProfile = async () => {
  const response = await api.get("/auth/verify-session");
  return response.data;
};

// Update user profile (only name and bio can be updated)
export const updateProfile = async (name?: string, bio?: string) => {
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (bio !== undefined) data.bio = bio;

  const response = await api.put("/auth/profile", data);
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

// Delete account
export const deleteAccount = async (password: string, confirmText: string) => {
  const response = await api.delete("/auth/account", {
    data: { password, confirmText },
  });
  return response.data;
};

// Upload avatar
export const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await api.put("/auth/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Delete avatar
export const deleteAvatar = async () => {
  const response = await api.delete("/auth/profile/avatar");
  return response.data;
};