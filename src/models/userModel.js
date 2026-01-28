const pool = require('../config/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const userModel = {
  async createUser(email, password) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const query = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, created_at;
    `;

    const result = await pool.query(query, [email, passwordHash]);
    return result.rows[0];
  },

  async findByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1;`;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const query = `SELECT id, email, created_at FROM users WHERE id = $1;`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const query = `UPDATE users SET password_hash = $1 WHERE id = $2;`;
    await pool.query(query, [passwordHash, userId]);
  },

  async emailExists(email) {
    const query = `SELECT COUNT(*) FROM users WHERE email = $1;`;
    const result = await pool.query(query, [email]);
    return parseInt(result.rows[0].count) > 0;
  },
};

module.exports = userModel;
