import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL 
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`
    : "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration and unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 (Unauthorized), the token is invalid or expired
    // BUT: Don't log out for password validation errors (they should return 400, but be defensive)
    const errorMessage = error.response?.data?.error?.toLowerCase() || "";
    const isPasswordError = 
      errorMessage.includes("password is incorrect") ||
      errorMessage.includes("incorrect password") ||
      errorMessage.includes("current password");
    
    if (error.response?.status === 401 && !isPasswordError) {
      // Clear all auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tempToken");
      localStorage.setItem("hasLoggedOut", "true");
      
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
