import NodeCache from "node-cache";
import jwt from "jsonwebtoken";

/**
 * Token Blacklist Service
 * 
 * Provides in-memory token blacklisting for robust logout functionality.
 * Uses node-cache with automatic TTL-based cleanup.
 * 
 * Features:
 * - Single token blacklisting (for normal logout)
 * - User-level blacklisting (for "logout all sessions")
 * - Automatic cleanup of expired entries
 */

// Cache configuration
// stdTTL: 0 means we'll set TTL per-entry based on token expiry
// checkperiod: check for expired entries every 60 seconds
const tokenBlacklist = new NodeCache({ stdTTL: 0, checkperiod: 60 });

// Track user logout timestamps for "logout all sessions" feature
// Key: userId, Value: timestamp when logoutAll was called
const userLogoutTimestamps = new NodeCache({ stdTTL: 3600, checkperiod: 60 });

/**
 * Add a token to the blacklist
 * @param {string} token - The JWT token to blacklist
 * @param {string|number} userId - The user ID associated with the token
 */
export const blacklistToken = (token, userId) => {
  try {
    // Decode token to get expiry time
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
      // If we can't decode, use default TTL of 1 hour
      tokenBlacklist.set(token, { userId, blacklistedAt: Date.now() }, 3600);
      console.log(`🔒 Token blacklisted for user ${userId} (default TTL: 1h)`);
      return;
    }

    // Calculate remaining TTL (in seconds)
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    // Only blacklist if token hasn't already expired
    if (ttl > 0) {
      tokenBlacklist.set(token, { userId, blacklistedAt: Date.now() }, ttl);
      console.log(`🔒 Token blacklisted for user ${userId} (TTL: ${ttl}s)`);
    } else {
      console.log(`⏰ Token already expired for user ${userId}, skipping blacklist`);
    }
  } catch (error) {
    console.error("Error blacklisting token:", error);
    // Fail-safe: blacklist with default TTL
    tokenBlacklist.set(token, { userId, blacklistedAt: Date.now() }, 3600);
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The JWT token to check
 * @returns {boolean} - True if token is blacklisted
 */
export const isTokenBlacklisted = (token) => {
  // Check if specific token is blacklisted
  if (tokenBlacklist.has(token)) {
    return true;
  }

  // Check if user has logged out all sessions
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.id) {
      const logoutTimestamp = userLogoutTimestamps.get(decoded.id.toString());
      if (logoutTimestamp) {
        // Token issued before logout-all should be invalid
        const tokenIssuedAt = (decoded.iat || 0) * 1000; // Convert to milliseconds
        if (tokenIssuedAt < logoutTimestamp) {
          return true;
        }
      }
    }
  } catch (error) {
    console.error("Error checking token blacklist:", error);
  }

  return false;
};

/**
 * Blacklist all tokens for a user (logout all sessions)
 * Instead of tracking every token, we store a timestamp.
 * Any token issued before this timestamp is considered invalid.
 * @param {string|number} userId - The user ID
 */
export const blacklistAllUserTokens = (userId) => {
  const timestamp = Date.now();
  // Store for 1 hour (matches access token expiry)
  userLogoutTimestamps.set(userId.toString(), timestamp, 3600);
  console.log(`🔒 All tokens blacklisted for user ${userId} at ${new Date(timestamp).toISOString()}`);
};

/**
 * Get blacklist statistics (for debugging/monitoring)
 * @returns {object} - Statistics about the blacklist
 */
export const getBlacklistStats = () => {
  return {
    blacklistedTokens: tokenBlacklist.keys().length,
    usersWithLogoutAll: userLogoutTimestamps.keys().length,
    cacheStats: {
      tokens: tokenBlacklist.getStats(),
      users: userLogoutTimestamps.getStats()
    }
  };
};

export default {
  blacklistToken,
  isTokenBlacklisted,
  blacklistAllUserTokens,
  getBlacklistStats
};
