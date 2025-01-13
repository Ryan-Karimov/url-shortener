const pool = require('../db');

const createShortUrl = async (originalUrl, alias, expiresAt) => {
    let shortUrl = alias;

    if (!alias) {
        do {
            shortUrl = generateRandomShortUrl();
        } while (!(await checkUniqueShortUrl(shortUrl)));
    } else {
        if (alias.length > 20) {
            throw new Error('Alias cannot exceed 20 characters');
        }
        if (!(await checkUniqueShortUrl(shortUrl))) {
            throw new Error('Alias is not unique');
        }
    }

    const query = `
        INSERT INTO urls (short_url, original_url, alias, expires_at)
        VALUES ($1, $2, $3, $4) RETURNING *;
    `;

    const result = await pool.query(query, [shortUrl, originalUrl, alias, expiresAt]);
    return result.rows[0];
};

const generateRandomShortUrl = () => {
    return Math.random().toString(36).slice(2, 8);
};

const checkUniqueShortUrl = async (shortUrl) => {
    const query = `SELECT COUNT(*) FROM urls WHERE short_url = $1;`;
    const result = await pool.query(query, [shortUrl]);
    return result.rows[0].count === "0";
};

const getOriginalUrl = async (shortUrl) => {
    const query = `SELECT original_url, to_char(created_at, 'DD/MM/YYYY') AS created_at, click_count FROM urls WHERE short_url = $1;`;
    const result = await pool.query(query, [shortUrl]);
    return result.rows[0];
};

const incrementClickCount = async (shortUrl, ipAddress) => {
    await pool.query(`UPDATE urls SET click_count = click_count + 1 WHERE short_url = $1;`, [shortUrl]);
    await pool.query(`INSERT INTO clicks (short_url, ip_address) VALUES ($1, $2);`, [shortUrl, ipAddress]);
};

const deleteShortUrl = async (shortUrl) => {
    await pool.query(`DELETE FROM urls WHERE short_url = $1;`, [shortUrl]);
};

const getAnalytics = async (shortUrl) => {
    const urlData = await getOriginalUrl(shortUrl);
    const clicks = await pool.query(`SELECT ip_address, to_char(click_time, 'DD/MM/YYYY HH24:MI:SS') AS click_time FROM clicks WHERE short_url = $1 ORDER BY click_time DESC LIMIT 5;`, [shortUrl]);
    return { ...urlData, recentClicks: clicks.rows };
};

module.exports = { createShortUrl, getOriginalUrl, incrementClickCount, deleteShortUrl, getAnalytics };
