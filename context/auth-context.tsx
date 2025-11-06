"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authAPI } from "@/lib/api-client"

export interface AuthUser {
  email: string
}

export interface Auth2FAState {
  requires_2fa: boolean
  temp_token: string | null
  totp_secret: string | null
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  twoFAState: Auth2FAState
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  verify2FA: (totp_code: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [twoFAState, setTwoFAState] = useState<Auth2FAState>({
    requires_2fa: false,
    temp_token: null,
    totp_secret: null,
  })

  // Check if user has an existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("session_token")
        if (token) {
          const response = await authAPI.verifySession(token)
          if (response.authenticated && response.email) {
            setUser({ email: response.email })
          } else {
            localStorage.removeItem("session_token")
          }
        }
      } catch {
        localStorage.removeItem("session_token")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const register = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      await authAPI.register(email, password)
      // After successful registration, auto-login
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      const response = await authAPI.login(email, password)

      if (response.requires_2fa && response.temp_token && response.totp_secret) {
        setTwoFAState({
          requires_2fa: true,
          temp_token: response.temp_token,
          totp_secret: response.totp_secret,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const verify2FA = async (totp_code: string) => {
    try {
      setError(null)
      setIsLoading(true)

      if (!twoFAState.temp_token) {
        throw new Error("No 2FA session active")
      }

      const response = await authAPI.verify2FA(twoFAState.temp_token, totp_code)

      if (response.session_token && response.email) {
        localStorage.setItem("session_token", response.session_token)
        setUser({ email: response.email })
        setTwoFAState({
          requires_2fa: false,
          temp_token: null,
          totp_secret: null,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "2FA verification failed")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      const token = localStorage.getItem("session_token")
      if (token) {
        await authAPI.logout(token)
      }
      localStorage.removeItem("session_token")
      setUser(null)
      setTwoFAState({
        requires_2fa: false,
        temp_token: null,
        totp_secret: null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed")
      throw err
    }
  }

  const clearError = () => setError(null)

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    twoFAState,
    register,
    login,
    verify2FA,
    logout,
    error,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
