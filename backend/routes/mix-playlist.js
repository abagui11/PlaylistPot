// routes/mixPlaylist.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/mix-playlist', async (req, res) => {
  const { selectedItems, playlistSize } = req.body;
  const accessToken = req.headers.authorization;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  try {
    let playlist = [];
    let trackPool = {}; // Dictionary to hold track pools for each item by ID

    // Helper function to get an artist's albums and their tracks
    const fetchAdditionalTracks = async (artistId) => {
      try {
        const albumsResponse = await axios.get(
          `https://api.spotify.com/v1/artists/${artistId}/albums`,
          { headers: { Authorization: accessToken } }
        );

        const albums = albumsResponse.data.items;
        let additionalTracks = [];

        for (const album of albums) {
          const albumTracksResponse = await axios.get(
            `https://api.spotify.com/v1/albums/${album.id}/tracks`,
            { headers: { Authorization: accessToken } }
          );

          additionalTracks = additionalTracks.concat(albumTracksResponse.data.items);

          // Stop fetching if we reach enough tracks for this artist
          if (additionalTracks.length >= playlistSize) break;
        }

        return additionalTracks;
      } catch (error) {
        console.error(`Error fetching additional tracks for artist ${artistId}:`, error.message);
        return [];
      }
    };

    // Initialize track pools for each artist, album, or track
    for (const item of selectedItems) {
      if (item.type === 'artist') {
        const response = await axios.get(
          `https://api.spotify.com/v1/artists/${item.id}/top-tracks?market=US`,
          { headers: { Authorization: accessToken } }
        );
        trackPool[item.id] = response.data.tracks;

        // If more tracks are needed, fetch from artist's albums
        if (trackPool[item.id].length < playlistSize) {
          const additionalTracks = await fetchAdditionalTracks(item.id);
          trackPool[item.id] = trackPool[item.id].concat(additionalTracks);
        }
      } else if (item.type === 'album') {
        const response = await axios.get(
          `https://api.spotify.com/v1/albums/${item.id}/tracks`,
          { headers: { Authorization: accessToken } }
        );
        trackPool[item.id] = response.data.items;
      } else if (item.type === 'track') {
        trackPool[item.id] = [item];
      }
    }

    // Round-robin selection of tracks to reach desired playlist size
    while (playlist.length < playlistSize) {
      let itemsExhausted = true;

      for (const item of selectedItems) {
        const trackList = trackPool[item.id];

        if (!trackList || trackList.length === 0) {
          // If no tracks left for this item, skip to the next item in the round
          continue;
        }

        // Select a random track from the trackList and add it to the playlist
        const randomIndex = Math.floor(Math.random() * trackList.length);
        const track = trackList.splice(randomIndex, 1)[0]; // Remove and get the track
        playlist.push(track);
        itemsExhausted = false; // Set to false if any item has tracks left

        // Check if we've reached the desired playlist size
        if (playlist.length >= playlistSize) break;
      }

      // If all items are exhausted and we can't fill the playlist size, stop
      if (itemsExhausted) break;
    }

    // Final check for playlist length
    if (playlist.length < playlistSize) {
      return res.status(400).json({
        error: 'Not enough unique tracks to meet the desired playlist size. Add more items or reduce the playlist size.',
      });
    }

    res.json({ tracks: playlist });
  } catch (error) {
    console.error("Error generating mixed playlist:", error);
    res.status(500).json({ error: 'Failed to generate mixed playlist' });
  }
});

module.exports = router;
