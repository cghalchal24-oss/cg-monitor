const express = require('express');
const { scrapeAll } = require('./scraper');
const axios = require('axios');

const app = express();
app.use(express.json());

let cache = { data: null, timestamp: null };

app.get('/api/updates', async (req, res) => {
  const now = Date.now();
  if (!cache.timestamp || (now - cache.timestamp) > 120000) {
    try {
      cache.data = await scrapeAll();
      cache.timestamp = now;
    } catch (err) {
      if (cache.data) return res.json(cache.data);
      return res.status(500).json({ error: 'Failed' });
    }
  }
  res.json(cache.data);
});

app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const response = await axios({ method: 'get', url, responseType: 'stream', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const filename = url.split('/').pop() || 'document.pdf';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    response.data.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = app;