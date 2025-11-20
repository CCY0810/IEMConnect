import api from "./api";

// Logout - invalidate session on server
export const logout = async (): Promise<void> => {
  try {
    // Call backend logout endpoint to invalidate token
    await api.post("/auth/logout");
  } catch (error) {
    // Even if API call fails, we still want to clear local storage
    console.error("Logout API call failed:", error);
  }
};

