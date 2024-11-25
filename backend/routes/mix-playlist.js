const express = require('express');
const axios = require('axios');
const router = express.Router();

// Helper Function: Random Sampling
const getRandomSample = (tracks, sampleSize) => {
  const shuffled = tracks.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(sampleSize, tracks.length));
};

// Helper Function: Calculate Percentile Threshold
const calculateThreshold = (tracks, percentile) => {
  if (tracks.length === 0) return null;

  const popularityValues = tracks.map((track) => track.popularity);
  const avgPopularity = popularityValues.reduce((sum, val) => sum + val, 0) / popularityValues.length;
  const stdDev = Math.sqrt(
    popularityValues.map((val) => Math.pow(val - avgPopularity, 2)).reduce((sum, val) => sum + val, 0) / popularityValues.length
  );

  const threshold = avgPopularity - (percentile / 100) * stdDev;
  return Math.max(threshold, 0); // Ensure threshold is not negative
};

// Helper Function: Filter Tracks for Artists
const filterArtistTracks = (tracks, percentile) => {
  if (tracks.length === 0) return [];

  const sampledTracks = getRandomSample(tracks, Math.min(10, tracks.length));
  const threshold = calculateThreshold(sampledTracks, percentile);

  return tracks.filter((track) => track.popularity <= threshold);
};

// Mix Playlist Route
router.post('/mix-playlist', async (req, res) => {
  const { selectedItems, playlistSize, popularityValue } = req.body;
  console.log('Received Mix Playlist Request:', { selectedItems, playlistSize, popularityValue });

  const accessToken = req.headers.authorization;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    let trackPool = {}; // Track pools for each item by ID
    const playlist = [];

    // Step 1: Include Explicit Tracks from the Pot
    const explicitTracks = selectedItems.filter((item) => item.type === 'track');
    playlist.push(...explicitTracks);

    // Step 2: Allocate Remaining Slots
    const remainingSize = playlistSize - playlist.length;
    if (remainingSize <= 0) {
      return res.json({ tracks: playlist.slice(0, playlistSize) }); // Return if already full
    }

    const otherItems = selectedItems.filter((item) => item.type !== 'track');
    const allocation = Math.floor(remainingSize / otherItems.length);
    let remainder = remainingSize % otherItems.length;

    // Step 3: Fetch Tracks for Artists and Albums
    for (const item of otherItems) {
      if (item.type === 'artist') {
        const response = await axios.get(
          `https://api.spotify.com/v1/artists/${item.id}/top-tracks?market=US`,
          { headers: { Authorization: accessToken } }
        );
        trackPool[item.id] = response.data.tracks || [];
      } else if (item.type === 'album') {
        const response = await axios.get(
          `https://api.spotify.com/v1/albums/${item.id}/tracks`,
          { headers: { Authorization: accessToken } }
        );
        trackPool[item.id] = response.data.items || [];
      }
    }

    // Step 4: Add Tracks for Albums and Artists
    for (const item of otherItems) {
      let tracksToAdd = allocation + (remainder > 0 ? 1 : 0);
      remainder = Math.max(remainder - 1, 0);

      if (item.type === 'album') {
        // Add all album tracks up to the allocated number
        const albumTracks = trackPool[item.id].slice(0, tracksToAdd);
        playlist.push(...albumTracks);
      } else if (item.type === 'artist') {
        // Filter artist tracks based on popularity
        const artistTracks = filterArtistTracks(trackPool[item.id], popularityValue || 100);
        const selectedTracks = artistTracks.slice(0, tracksToAdd); // Take up to allocated number
        playlist.push(...selectedTracks);
      }
    }

    // Step 5: Handle Insufficient Tracks
    if (playlist.length < playlistSize) {
      console.warn('Not enough unique tracks to meet the desired playlist size. Filling remainder.');

      for (const item of otherItems) {
        const remainingTracks = trackPool[item.id];
        const extraTracks = remainingTracks.slice(0, playlistSize - playlist.length);
        playlist.push(...extraTracks);

        if (playlist.length >= playlistSize) break;
      }
    }

    res.json({ tracks: playlist.slice(0, playlistSize) }); // Return final playlist
  } catch (error) {
    console.error('Error generating mixed playlist:', error.message);
    res.status(500).json({ error: 'Failed to generate mixed playlist' });
  }
});

module.exports = router;
