const redis = require('../config/redis');

const CACHE_PREFIX = 'url:';
const DEFAULT_TTL = 3600; // 1 hour

const cacheService = {
  async getUrl(shortUrl) {
    try {
      const data = await redis.get(`${CACHE_PREFIX}${shortUrl}`);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (err) {
      console.error('Cache get error:', err.message);
      return null;
    }
  },

  async setUrl(shortUrl, data, ttl = DEFAULT_TTL) {
    try {
      await redis.setex(`${CACHE_PREFIX}${shortUrl}`, ttl, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Cache set error:', err.message);
      return false;
    }
  },

  async invalidateUrl(shortUrl) {
    try {
      await redis.del(`${CACHE_PREFIX}${shortUrl}`);
      return true;
    } catch (err) {
      console.error('Cache invalidate error:', err.message);
      return false;
    }
  },

  async incrementHotScore(shortUrl) {
    try {
      await redis.zincrby('hot:urls', 1, shortUrl);
      return true;
    } catch (err) {
      console.error('Hot score increment error:', err.message);
      return false;
    }
  },

  async getHotUrls(limit = 10) {
    try {
      return await redis.zrevrange('hot:urls', 0, limit - 1, 'WITHSCORES');
    } catch (err) {
      console.error('Get hot URLs error:', err.message);
      return [];
    }
  },
};

module.exports = cacheService;
