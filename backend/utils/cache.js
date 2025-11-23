import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Better performance
});

/**
 * Get cached data or fetch and cache it
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<any>} Cached or freshly fetched data
 */
export const getCached = async (key, fetchFn, ttl = 300) => {
  const cached = cache.get(key);
  if (cached) {
    console.log(`[CACHE HIT] ${key}`);
    return cached;
  }
  
  console.log(`[CACHE MISS] ${key}`);
  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
};

/**
 * Invalidate cache by key
 * @param {string} key - Cache key to invalidate
 */
export const invalidateCache = (key) => {
  cache.del(key);
  console.log(`[CACHE INVALIDATED] ${key}`);
};

/**
 * Invalidate all cache entries matching a pattern
 * @param {string} pattern - Pattern to match (uses includes)
 */
export const invalidateCachePattern = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
    }
  });
  console.log(`[CACHE INVALIDATED] Pattern: ${pattern}`);
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  cache.flushAll();
  console.log('[CACHE CLEARED] All entries');
};

export default cache;

