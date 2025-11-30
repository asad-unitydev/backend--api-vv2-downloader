const express = require('express');
const serverless = require('serverless-http');
const tiktok = require('tiktok-scraper-without-watermark');
const instagram = require('instagram-url-direct');
const fb = require('fb-downloader-scrapper');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json());

const axios = require('axios');

// Helper to expand short URLs
async function expandUrl(shortUrl) {
  try {
    const response = await axios.head(shortUrl, {
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.request.res.responseUrl || shortUrl; // axios provides final URL here
  } catch (error) {
    console.error("Error expanding URL:", error.message);
    return shortUrl; // Fallback to original
  }
}

// TikTok Endpoint
router.get('/tiktok', async (req, res) => {
  try {
    let { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Expand URL if it's a short link
    if (url.includes('t.tiktok.com') || url.includes('vm.tiktok.com')) {
      url = await expandUrl(url);
    }

    console.log("Processing TikTok URL:", url);

    const data = await tiktok.tiktokdl(url);

    // Check if data is valid
    if (!data || (!data.video && !data.noWatermark)) {
      throw new Error("Failed to scrape video data. The link might be invalid or TikTok has blocked the scraper.");
    }

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
    console.error("TikTok API Error:", error);
    res.status(500).json({
      error: error.message,
      details: "Please try a different link or try again later."
    });
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

// Handle both /api prefix (from redirect) and root (direct function access)
app.use('/.netlify/functions/api', router); // Direct access
app.use('/api', router); // Redirect access
app.use('/', router); // Fallback

module.exports.handler = serverless(app);
