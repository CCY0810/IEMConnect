"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { logout as logoutAPI } from "@/lib/auth-api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
  membership_number: string;
  matric_number: string;
  faculty: string;
  bio?: string;
  avatar_url?: string;
}

interface AuthContextType {
  isLoading: boolean;
  user: User | null;
  token: string | null;
  tempToken: string | null;
  login: (tempToken: string) => void;
  verify2FA: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has explicitly logged out (prevent auto-login after logout)
    const hasLoggedOut = localStorage.getItem("hasLoggedOut");
    if (hasLoggedOut === "true") {
      // Clear the logout flag and don't restore session
      localStorage.removeItem("hasLoggedOut");
      setIsLoading(false);
      return;
    }

    // Only restore session if user hasn't logged out
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newTempToken: string) => {
    setTempToken(newTempToken);
    localStorage.setItem("tempToken", newTempToken);
  };

  const verify2FA = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    setTempToken(null);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
    localStorage.removeItem("tempToken");
    // Clear logout flag on successful login to allow auto-login on next visit
    localStorage.removeItem("hasLoggedOut");
  };

  const logout = async () => {
    try {
      // Call backend logout API to invalidate token on server
      await logoutAPI();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout API error:", error);
    } finally {
      // Clear all authentication data from state
      setUser(null);
      setToken(null);
      setTempToken(null);

      // Clear all localStorage items related to authentication
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tempToken");
      
      // Set logout flag to prevent auto-login on next page load
      localStorage.setItem("hasLoggedOut", "true");

      // Force redirect to login page with hard reload to clear all state
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoading, user, token, tempToken, login, verify2FA, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
