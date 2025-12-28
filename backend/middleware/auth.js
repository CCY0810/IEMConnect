import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { isTokenBlacklisted } from "../services/tokenBlacklistService.js"

dotenv.config()

export const verifyTempToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "No token provided" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "temp-secret", {
      algorithms: ["HS256"],
    })
    if (decoded.state !== "2FA_PENDING") {
      return res.status(401).json({ error: "Invalid token state" })
    }
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "No token provided" })
  }

  // Check if token has been revoked (logout)
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ error: "Token has been revoked" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret-key")
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

export const verifyRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" })
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh-secret")
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" })
  }
}