import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Helper function to check if user is admin from token
const isAdminUser = (req) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return false;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret-key");
    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
};

// Rate limiter for reports endpoints (more restrictive)
export const reportsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs (was 50)
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use real client IP from X-Forwarded-For header (set by reverse proxy)
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1')) {
      return true;
    }
    // Skip rate limiting for authenticated admin users
    return isAdminUser(req);
  },
});

// General API rate limiter (less restrictive)
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit: 500 requests per 15 minutes for normal app usage
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use real client IP from X-Forwarded-For header (set by reverse proxy)
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for localhost in development
    if (process.env.NODE_ENV === 'development' && (req.ip === '::1' || req.ip === '127.0.0.1')) {
      return true;
    }
    // Skip rate limiting for authenticated admin users
    return isAdminUser(req);
  },
});

