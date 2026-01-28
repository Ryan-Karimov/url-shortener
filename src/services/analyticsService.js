const pool = require('../config/db');
const geoService = require('./geoService');
const { parseUserAgent } = require('../utils/deviceParser');

const analyticsService = {
  async recordClick(shortUrl, ip, userAgent, referrer) {
    const geo = geoService.lookup(ip);
    const device = parseUserAgent(userAgent);

    const query = `
      INSERT INTO clicks (short_url, ip_address, country, city, device_type, browser, os, referrer)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;

    await pool.query(query, [
      shortUrl,
      ip,
      geo.country,
      geo.city,
      device.deviceType,
      device.browser,
      device.os,
      referrer || null,
    ]);
  },

  async getFullAnalytics(shortUrl) {
    const [summary, daily, countries, devices, browsers, recentClicks] = await Promise.all([
      this.getSummary(shortUrl),
      this.getClicksByDay(shortUrl, 30),
      this.getClicksByCountry(shortUrl),
      this.getClicksByDevice(shortUrl),
      this.getClicksByBrowser(shortUrl),
      this.getRecentClicks(shortUrl, 10),
    ]);

    return {
      summary,
      daily,
      countries,
      devices,
      browsers,
      recentClicks,
    };
  },

  async getSummary(shortUrl) {
    const query = `
      SELECT
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_visitors,
        MIN(click_time) as first_click,
        MAX(click_time) as last_click
      FROM clicks
      WHERE short_url = $1;
    `;

    const result = await pool.query(query, [shortUrl]);
    return result.rows[0];
  },

  async getClicksByDay(shortUrl, days = 30) {
    const query = `
      SELECT
        DATE(click_time) as date,
        COUNT(*) as clicks
      FROM clicks
      WHERE short_url = $1
        AND click_time >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(click_time)
      ORDER BY date ASC;
    `;

    const result = await pool.query(query, [shortUrl]);
    return result.rows;
  },

  async getClicksByCountry(shortUrl) {
    const query = `
      SELECT
        country,
        COUNT(*) as clicks,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM clicks
      WHERE short_url = $1
      GROUP BY country
      ORDER BY clicks DESC
      LIMIT 20;
    `;

    const result = await pool.query(query, [shortUrl]);
    return result.rows;
  },

  async getClicksByDevice(shortUrl) {
    const query = `
      SELECT
        device_type,
        COUNT(*) as clicks,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM clicks
      WHERE short_url = $1
      GROUP BY device_type
      ORDER BY clicks DESC;
    `;

    const result = await pool.query(query, [shortUrl]);
    return result.rows;
  },

  async getClicksByBrowser(shortUrl) {
    const query = `
      SELECT
        browser,
        COUNT(*) as clicks,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM clicks
      WHERE short_url = $1
      GROUP BY browser
      ORDER BY clicks DESC
      LIMIT 10;
    `;

    const result = await pool.query(query, [shortUrl]);
    return result.rows;
  },

  async getClicksByOS(shortUrl) {
    const query = `
      SELECT
        os,
        COUNT(*) as clicks,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM clicks
      WHERE short_url = $1
      GROUP BY os
      ORDER BY clicks DESC
      LIMIT 10;
    `;

    const result = await pool.query(query, [shortUrl]);
    return result.rows;
  },

  async getRecentClicks(shortUrl, limit = 10) {
    const query = `
      SELECT
        ip_address,
        country,
        city,
        device_type,
        browser,
        os,
        referrer,
        to_char(click_time, 'YYYY-MM-DD HH24:MI:SS') as click_time
      FROM clicks
      WHERE short_url = $1
      ORDER BY click_time DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [shortUrl, limit]);
    return result.rows;
  },

  async getReferrers(shortUrl) {
    const query = `
      SELECT
        COALESCE(referrer, 'Direct') as referrer,
        COUNT(*) as clicks,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM clicks
      WHERE short_url = $1
      GROUP BY referrer
      ORDER BY clicks DESC
      LIMIT 10;
    `;

    const result = await pool.query(query, [shortUrl]);
    return result.rows;
  },
};

module.exports = analyticsService;
