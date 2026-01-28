const urlModel = require('../models/urlModel');
const cacheService = require('./cacheService');
const analyticsService = require('./analyticsService');

const urlService = {
  async getUrlWithCache(shortUrl) {
    // Try cache first
    let data = await cacheService.getUrl(shortUrl);

    if (data) {
      return data;
    }

    // Fetch from database
    data = await urlModel.getOriginalUrl(shortUrl);

    if (data) {
      // Cache for 1 hour
      await cacheService.setUrl(shortUrl, data, 3600);
    }

    return data;
  },

  async createUrl(originalUrl, alias, expiresAt, userId) {
    const url = await urlModel.createShortUrl(originalUrl, alias, expiresAt, userId);
    return url;
  },

  async handleRedirect(shortUrl, ip, userAgent, referrer) {
    const urlData = await this.getUrlWithCache(shortUrl);

    if (!urlData) {
      return { error: 'not_found' };
    }

    // Check expiration
    if (urlData.expires_at && new Date(urlData.expires_at) < new Date()) {
      return { error: 'expired' };
    }

    // Record click asynchronously (don't wait)
    Promise.all([
      urlModel.incrementClickCount(shortUrl),
      analyticsService.recordClick(shortUrl, ip, userAgent, referrer),
      cacheService.incrementHotScore(shortUrl),
    ]).catch((err) => console.error('Error recording click:', err));

    return { originalUrl: urlData.original_url };
  },

  async deleteUrl(shortUrl, userId) {
    const deleted = await urlModel.deleteShortUrl(shortUrl, userId);

    if (deleted) {
      await cacheService.invalidateUrl(shortUrl);
    }

    return deleted;
  },

  async getUserUrls(userId, page, limit) {
    return urlModel.getUserUrls(userId, page, limit);
  },

  async getUrlInfo(shortUrl) {
    return urlModel.getUrlInfo(shortUrl);
  },

  async urlBelongsToUser(shortUrl, userId) {
    return urlModel.urlBelongsToUser(shortUrl, userId);
  },
};

module.exports = urlService;
