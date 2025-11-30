const express = require('express');
const serverless = require('serverless-http');
const tiktok = require('tiktok-scraper-without-watermark');
const instagram = require('instagram-url-direct');
const fb = require('fb-downloader-scrapper');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json());

// TikTok Endpoint
router.get('/tiktok', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const data = await tiktok.tiktokdl(url);
    // Ensure we return a consistent structure
    res.json({
      status: 'success',
      platform: 'tiktok',
      title: data.title,
      cover: data.video?.cover || data.cover,
      video_no_watermark: data.video?.noWatermark || data.noWatermark,
      video_watermark: data.video?.watermark || data.watermark,
      music: data.music?.url || data.music,
      stats: data.stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Instagram Endpoint
router.get('/instagram', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const data = await instagram(url);
    res.json({
      status: 'success',
      platform: 'instagram',
      results_number: data.results_number,
      url_list: data.url_list // Contains direct URLs (usually no watermark)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Facebook Endpoint
router.get('/facebook', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const data = await fb(url);
    res.json({
      status: 'success',
      platform: 'facebook',
      hd: data.hd, // HD Video URL
      sd: data.sd, // SD Video URL
      title: data.title,
      thumbnail: data.thumbnail
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health Check
router.get('/', (req, res) => {
  res.json({ status: 'API is running', version: '1.0.0' });
});

app.use('/api', router);

module.exports.handler = serverless(app);
