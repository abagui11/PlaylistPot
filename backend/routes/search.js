// routes/search.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/search', async (req, res) => {
  const { query, type } = req.query; // Capture the type filter
  const accessToken = req.headers.authorization;

  if (!accessToken) {
    console.error("Access token is missing.");
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search`,
      {
        headers: { Authorization: accessToken },
        params: {
          q: query,
          type: type, // Pass the filter type directly to Spotify API
          limit: 10,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching search results from Spotify:", error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

module.exports = router;
