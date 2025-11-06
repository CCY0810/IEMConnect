
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

export interface AuthResponse {
  message: string
  email?: string
  requires_2fa?: boolean
  temp_token?: string
  totp_secret?: string
  session_token?: string
  authenticated?: boolean
}

export interface ApiError {
  error: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  if (!response.ok) {
    throw new Error((data as ApiError).error || "API request failed")
  }
  return data as T
}

export const authAPI = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse<AuthResponse>(response)
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse<AuthResponse>(response)
  },

  verify2FA: async (temp_token: string, totp_code: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/verify-2fa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temp_token, totp_code }),
    })
    return handleResponse<AuthResponse>(response)
  },

   verifySession: async (token: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/verify-session`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return handleResponse<AuthResponse>(response)
  },

  logout: async (token: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
    return handleResponse<AuthResponse>(response)
  },
}
