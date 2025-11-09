import api from "./api";

// Get unverified users (admin only)
export const getUnverifiedUsers = async () => {
  const response = await api.get("/auth/unverified-users");
  return response.data;
};

// Verify a user (admin only)
export const verifyUser = async (userId: number) => {
  const response = await api.post("/auth/verify-user", { userId });
  return response.data;
};
