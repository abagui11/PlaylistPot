const express = require('express');
const axios = require('axios');
const router = express.Router();

// Mix Playlist Route
router.post('/mix-playlist', async (req, res) => {
  const { selectedItems, playlistSize } = req.body;
  console.log('Received Mix Playlist Request:', { selectedItems, playlistSize });

  const accessToken = req.headers.authorization;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    const playlist = [];
    const trackPool = {};

    // Step 1: Include Explicit Tracks from the Pot
    const explicitTracks = selectedItems.filter((item) => item.type === 'track');
    const otherItems = selectedItems.filter((item) => item.type !== 'track');

    playlist.push(...explicitTracks);

    // Step 2: Check Remaining Slots
    const remainingSize = playlistSize - playlist.length;
    if (remainingSize <= 0) {
      return res.json({ tracks: playlist.slice(0, playlistSize) }); // Return if already full
    }

    // Step 3: Fetch Tracks for Artists and Albums
    for (const item of otherItems) {
      if (item.type === 'artist') {
        try {
          const response = await axios.get(
            `https://api.spotify.com/v1/artists/${item.id}/top-tracks?market=US`,
            { headers: { Authorization: accessToken } }
          );
          trackPool[item.id] = response.data.tracks || [];
        } catch (error) {
          console.warn(`Failed to fetch top tracks for artist ${item.id}:`, error.message);
        }
      } else if (item.type === 'album') {
        try {
          const response = await axios.get(
            `https://api.spotify.com/v1/albums/${item.id}/tracks`,
            { headers: { Authorization: accessToken } }
          );
          trackPool[item.id] = response.data.items || [];
        } catch (error) {
          console.warn(`Failed to fetch tracks for album ${item.id}:`, error.message);
        }
      }
    }

    // Step 4: Round-Robin through Artists and Albums
    const roundRobinItems = [...otherItems]; // Clone to avoid mutation
    while (playlist.length < playlistSize && roundRobinItems.length > 0) {
      const item = roundRobinItems.shift(); // Take the first item

      if (trackPool[item.id] && trackPool[item.id].length > 0) {
        const track = trackPool[item.id].shift(); // Take one track from the pool
        playlist.push(track);

        // If there are still tracks left, re-add the item to the end of the round-robin queue
        if (trackPool[item.id].length > 0) {
          roundRobinItems.push(item);
        }
      }
    }

    // Step 5: Return Final Playlist
    res.json({ tracks: playlist.slice(0, playlistSize) });
  } catch (error) {
    console.error('Error generating mixed playlist:', error.message);
    res.status(500).json({ error: 'Failed to generate mixed playlist' });
  }
});

module.exports = router;
