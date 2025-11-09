"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  role: "member" | "admin"
  membership_number: string
}

interface AuthContextType {
  isLoading: boolean
  user: User | null
  token: string | null
  tempToken: string | null
  login: (tempToken: string) => void
  verify2FA: (user: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [tempToken, setTempToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (newTempToken: string) => {
    setTempToken(newTempToken)
    localStorage.setItem("tempToken", newTempToken)
  }

  const verify2FA = (newUser: User, newToken: string) => {
    setUser(newUser)
    setToken(newToken)
    setTempToken(null)
    localStorage.setItem("user", JSON.stringify(newUser))
    localStorage.setItem("token", newToken)
    localStorage.removeItem("tempToken")
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setTempToken(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("tempToken")
  }

  return (
    <AuthContext.Provider value={{ isLoading, user, token, tempToken, login, verify2FA, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
