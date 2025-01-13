const express = require('express');
const { createShortUrl, getOriginalUrl, incrementClickCount, deleteShortUrl, getAnalytics } = require('../models/urlModel');

const router = express.Router();
const baseUrl = 'http://localhost:3000/';

router.post('/shorten', async (req, res) => {
    const { originalUrl, alias, expiresAt } = req.body;
    try {
        const result = await createShortUrl(originalUrl, alias, expiresAt);
        res.json({ shortUrl: `${baseUrl}${result.short_url}` });
    } catch (err) {
        res.status(500).json({ 
            error: 'Error creating short URL',
            message: err.message
         });
    }
});

router.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    try {
        const urlData = await getOriginalUrl(shortUrl);
        if (!urlData) return res.status(404).send('URL not found');
        if (urlData.expires_at && new Date(urlData.expires_at) < new Date()) {
            return res.status(410).send('URL expired');
        }
        
        await incrementClickCount(shortUrl, req.ip);
        res.redirect(urlData.original_url);
    } catch (err) {
        res.status(500).json({ 
            error: 'Error redirecting',
            message: err.message
         });
    }
});

router.get('/info/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    try {
        const urlData = await getOriginalUrl(shortUrl);
        if (!urlData) return res.status(404).send('URL not found');
        res.json(urlData);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching info' });
    }
});

router.get('/test/test', async (req, res) => {
    try {
        res.send('URL Shortener Services');
    } catch (err) {
        res.status(500).json({ error: 'Error fetching info' });
    }
});

router.delete('/delete/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    try {
        await deleteShortUrl(shortUrl);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Error deleting URL' });
    }
});

router.get('/analytics/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    try {
        const analytics = await getAnalytics(shortUrl);
        res.json(analytics);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching analytics' });
    }
});

module.exports = router;
