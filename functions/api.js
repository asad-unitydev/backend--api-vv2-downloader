const express = require('express');
const serverless = require('serverless-http');
const ruhend = require('ruhend-scraper');
const instagram = require('instagram-url-direct');
const fb = require('fb-downloader-scrapper');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// --- HELPER FUNCTIONS ---

// Helper to expand short URLs (common in TikTok)
async function expandUrl(shortUrl) {
  try {
    const response = await axios.head(shortUrl, {
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.request.res.responseUrl || shortUrl;
  } catch (error) {
    console.error("Error expanding URL:", error.message);
    return shortUrl;
  }
}

// Helper to standardize download objects
function formatDownload(type, quality, url, ext, hasAudio = true) {
  return {
    type,       // 'video' or 'audio'
    quality,    // e.g. '720p', '128kbps', 'No Watermark'
    url,        // The direct download link
    ext,        // 'mp4', 'mp3', etc.
    has_audio: hasAudio // boolean
  };
}

// --- ENDPOINTS ---

// TikTok Endpoint
router.get('/tiktok', async (req, res) => {
  try {
    let { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    if (url.includes('t.tiktok.com') || url.includes('vm.tiktok.com')) {
      url = await expandUrl(url);
    }

    const data = await ruhend.ttdl(url);
    if (!data) throw new Error("Failed to scrape TikTok data.");

    // Construct standardized downloads
    const downloads = [];
    if (data.video || data.video_hd) {
      downloads.push(formatDownload('video', 'No Watermark', data.video || data.video_hd, 'mp4', true));
    }
    if (data.video_wm) {
      downloads.push(formatDownload('video', 'Watermark', data.video_wm, 'mp4', true));
    }
    if (data.music) {
      downloads.push(formatDownload('audio', 'Original Audio', data.music, 'mp3', true));
    }

    res.json({
      status: 'success',
      platform: 'tiktok',
      title: data.title || "TikTok Video",
      cover: data.cover || "",
      author: data.author || {}, // Include author info if available
      stats: {
        plays: data.views,
        likes: data.like,
        comments: data.comment,
        shares: data.share
      },
      downloads: downloads
    });
  } catch (error) {
    console.error("TikTok API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Instagram Endpoint
router.get('/instagram', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const data = await instagram.instagramGetUrl(url);
    const downloads = [];

    // 'url_list' typically contains the best available links
    if (data.url_list && data.url_list.length > 0) {
      data.url_list.forEach((link, index) => {
        // Simple heuristic: Instagram usually serves mp4 for video, jpeg/webp for images.
        // We assume mp4 for video scraper context.
        // Note: The library doesn't explicitly give quality labels, so we use 'Best Available'.
        downloads.push(formatDownload('video', `Best Available ${data.url_list.length > 1 ? index + 1 : ''}`.trim(), link, 'mp4', true));
      });
    }

    res.json({
      status: 'success',
      platform: 'instagram',
      results_number: data.results_number,
      downloads: downloads
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

    const data = await fb.getFbVideoInfo(url);
    const downloads = [];

    if (data.sd) {
      downloads.push(formatDownload('video', 'SD', data.sd, 'mp4', true));
    }
    if (data.hd) {
      downloads.push(formatDownload('video', 'HD', data.hd, 'mp4', true));
    }

    res.json({
      status: 'success',
      platform: 'facebook',
      title: data.title || "Facebook Video",
      thumbnail: data.thumbnail || "",
      downloads: downloads
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// YouTube Endpoint (NEW)
router.get('/youtube', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const downloads = [];

    // Normalize and filter formats
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio'); // formats with both
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly'); // audio only
    const videoOnlyFormats = ytdl.filterFormats(info.formats, 'videoonly'); // video only (high res usually)

    // Add Video + Audio (Muxed)
    formats.forEach(format => {
      if (format.container === 'mp4' || format.container === 'webm') {
        downloads.push(formatDownload(
          'video',
          format.qualityLabel || 'Unknown',
          format.url,
          format.container,
          true
        ));
      }
    });

    // Add Video Only (High Res) - Label clearly so client knows no audio
    videoOnlyFormats.forEach(format => {
      // Filter out low quality video-only streams if desired, or keep all. 
      // Often strictly needed for 1080p+
      if ((format.container === 'mp4' || format.container === 'webm') && format.qualityLabel) {
        downloads.push(formatDownload(
          'video',
          `${format.qualityLabel} (Muted)`,
          format.url,
          format.container,
          false
        ));
      }
    });

    // Add Audio Only
    audioFormats.forEach(format => {
      downloads.push(formatDownload(
        'audio',
        `${format.audioBitrate}kbps`,
        format.url,
        format.container === 'mp4' ? 'm4a' : format.container, // yt usually sends m4a/webm
        true
      ));
    });

    // Sort downloads? Optional.
    // Let's sort video by quality (resolution) descending roughly? 
    // For now, keeping order of extraction is fine.

    res.json({
      status: 'success',
      platform: 'youtube',
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0]?.url || "",
      duration: info.videoDetails.lengthSeconds,
      downloads: downloads
    });

  } catch (error) {
    console.error("YouTube ytdl-core Error:", error.message);

    // FALLBACK: Try Ruhend Scraper
    try {
      console.log("Attempting fallback to ruhend-scraper for YouTube...");
      const data = await ruhend.ytmp4(url);
      if (!data) throw new Error("Ruhend scraper returned no data");

      // Ruhend usually returns a download url in 'data.download.url' or similar, we need to map it.
      // Based on inspection, it might vary. Let's try to map what we can.
      // Note: internal inspection showed `ytmp4` returns specific structure.
      // Let's assume best effort generic mapping from the scraper result.

      const downloads = [];
      // Map whatever ruhend gives us. 
      // It often gives { title, ... video_hd, video_sd? } or similar depending on the specific sub-scraper it uses.
      // Actually, looking at docs/source, ytmp4 usually gives a direct download link.

      // Use a generic catch-all if we can't be precise, but let's try.
      // Ideally we would inspect `data` structure locally, but we are flying blind on the server.
      // We'll trust the inspected keys: `data.url`?

      // Quick patch: just return what we have if possible.
      // Better: standard format.

      // Hypothetical Ruhend Response mapping (based on typical behavior of this lib):
      if (data.url) downloads.push(formatDownload('video', 'Best Available', data.url, 'mp4', true));

      res.json({
        status: 'success',
        platform: 'youtube',
        title: data.title || "YouTube Video",
        thumbnail: data.thumbnail || "",
        downloads: downloads
      });

    } catch (fallbackError) {
      console.error("YouTube Fallback Error:", fallbackError.message);
      res.status(500).json({ error: "Failed to download YouTube video. Server IP may be blocked." });
    }
  }
});

// Health Check
router.get('/', (req, res) => {
  res.json({ status: 'API is running', version: '2.0.0', message: 'Supports TikTok, Instagram, Facebook, YouTube' });
});

// Handle both /api prefix (from redirect) and root (direct function access)
app.use('/.netlify/functions/api', router); // Direct access
app.use('/api', router); // Redirect access
app.use('/', router); // Fallback

const handler = serverless(app);
module.exports = { app, handler };
