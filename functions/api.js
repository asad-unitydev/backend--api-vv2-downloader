try {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // CORRECTED METHOD: instagramGetUrl
  const data = await instagram.instagramGetUrl(url);

  res.json({
    status: 'success',
    platform: 'instagram',
    results_number: data.results_number,
    url_list: data.url_list
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

    // CORRECTED METHOD: getFbVideoInfo
    const data = await fb.getFbVideoInfo(url);

    res.json({
      status: 'success',
      platform: 'facebook',
      hd: data.hd,
      sd: data.sd,
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
