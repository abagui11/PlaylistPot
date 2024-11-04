// routes/auth.js
const express = require('express');
const axios = require('axios');
const qs = require('querystring');
require('dotenv').config();

const router = express.Router();
const REDIRECT_URI = process.env.STATUS === 'development' ? process.env.REDIRECT_URI_DEV: process.env.REDIRECT_URI_PROD;
const FRONTEND_URL = process.env.STATUS === 'development' ? process.env.FRONTEND_URL_DEV: process.env.FRONTEND_URL_PROD;

// Redirects to Spotify's authorization page
router.get('/login', (req, res) => {
  const authURL = `https://accounts.spotify.com/authorize?${qs.stringify({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: 'streaming user-read-playback-state user-modify-playback-state playlist-read-private playlist-modify-private',
  })}`;
  res.redirect(authURL);
});

// Handles the callback from Spotify and exchanges the code for tokens
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = response.data;

    // Send the access token back to the main window
    res.send(
      `<script>
        window.opener.postMessage({ accessToken: "${access_token}" }, "${FRONTEND_URL}");
        window.close();
      </script>`
    );
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).json({ error: "Failed to retrieve access token" });
  }
});


module.exports = router;