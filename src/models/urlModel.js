const pool = require('../config/db');
const { generateRandomShortUrl } = require('../utils/helpers');

const urlModel = {
  async createShortUrl(originalUrl, alias, expiresAt, userId) {
    let shortUrl = alias;

    if (!alias) {
      do {
        shortUrl = generateRandomShortUrl();
      } while (!(await this.isShortUrlUnique(shortUrl)));
    } else {
      if (alias.length > 20) {
        throw new Error('Alias cannot exceed 20 characters');
      }
      if (!(await this.isShortUrlUnique(shortUrl))) {
        throw new Error('Alias is already taken');
      }
    }

    const query = `
      INSERT INTO urls (short_url, original_url, alias, expires_at, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const result = await pool.query(query, [shortUrl, originalUrl, alias, expiresAt, userId]);
    return result.rows[0];
  },

  async isShortUrlUnique(shortUrl) {
    const query = `SELECT COUNT(*) FROM urls WHERE short_url = $1;`;
    const result = await pool.query(query, [shortUrl]);
    return result.rows[0].count === '0';
  },

  async getOriginalUrl(shortUrl) {
    const query = `
      SELECT original_url, expires_at, click_count, created_at, user_id
      FROM urls
      WHERE short_url = $1;
    `;
    const result = await pool.query(query, [shortUrl]);
    return result.rows[0] || null;
  },

  async getUrlInfo(shortUrl) {
    const query = `
      SELECT short_url, original_url, alias, expires_at, click_count,
             to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at, user_id
      FROM urls
      WHERE short_url = $1;
    `;
    const result = await pool.query(query, [shortUrl]);
    return result.rows[0] || null;
  },

  async incrementClickCount(shortUrl) {
    const query = `UPDATE urls SET click_count = click_count + 1 WHERE short_url = $1;`;
    await pool.query(query, [shortUrl]);
  },

  async deleteShortUrl(shortUrl, userId) {
    const query = `DELETE FROM urls WHERE short_url = $1 AND user_id = $2 RETURNING *;`;
    const result = await pool.query(query, [shortUrl, userId]);
    return result.rows[0] || null;
  },

  async getUserUrls(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT short_url, original_url, alias, click_count,
             to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
             expires_at
      FROM urls
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const countQuery = `SELECT COUNT(*) FROM urls WHERE user_id = $1;`;

    const [urlsResult, countResult] = await Promise.all([
      pool.query(query, [userId, limit, offset]),
      pool.query(countQuery, [userId]),
    ]);

    return {
      urls: urlsResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    };
  },

  async isUrlExpired(shortUrl) {
    const query = `SELECT expires_at FROM urls WHERE short_url = $1;`;
    const result = await pool.query(query, [shortUrl]);

    if (!result.rows[0]) return true;
    if (!result.rows[0].expires_at) return false;

    return new Date(result.rows[0].expires_at) < new Date();
  },

  async urlBelongsToUser(shortUrl, userId) {
    const query = `SELECT COUNT(*) FROM urls WHERE short_url = $1 AND user_id = $2;`;
    const result = await pool.query(query, [shortUrl, userId]);
    return result.rows[0].count !== '0';
  },
};

module.exports = urlModel;
