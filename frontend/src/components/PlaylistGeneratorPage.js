// src/components/PlaylistGeneratorPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlaylistGeneratorPage = ({ playlist, onBack, accessToken }) => {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [playlistName, setPlaylistName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (!accessToken) return;

    // Ensure the global Spotify function is available as a fallback
    window.onSpotifyWebPlaybackSDKReady = () => initializePlayer();

    const loadSpotifySDK = () => {
      if (!document.getElementById('spotify-sdk')) {
        const script = document.createElement('script');
        script.id = 'spotify-sdk';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          if (window.Spotify) {
            initializePlayer();
          }
        };
      } else if (window.Spotify) {
        initializePlayer();
      }
    };

    const initializePlayer = () => {
      if (!window.Spotify) {
        console.error("Spotify SDK not loaded.");
        return;
      }

      const newPlayer = new window.Spotify.Player({
        name: 'Playlist Pot Player',
        getOAuthToken: cb => cb(accessToken),
        volume: 0.5
      });

      newPlayer.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
        console.log("Spotify Player ready with Device ID:", device_id);
      });

      newPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setCurrentTrack(state.track_window.current_track);
      });

      newPlayer.addListener('initialization_error', ({ message }) => console.error("Initialization Error:", message));
      newPlayer.addListener('authentication_error', ({ message }) => console.error("Authentication Error:", message));
      newPlayer.addListener('account_error', ({ message }) => console.error("Account Error:", message));
      newPlayer.addListener('playback_error', ({ message }) => console.error("Playback Error:", message));

      newPlayer.connect().then(success => {
        if (success) {
          console.log("Connected to Spotify!");
        } else {
          console.error("Failed to connect to Spotify.");
        }
      });

      setPlayer(newPlayer);
    };

    loadSpotifySDK();

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  const playTrack = async (trackUri) => {
    if (!deviceId) return;

    await axios.put(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        uris: playlist.map(track => track.uri),
        offset: { uri: trackUri }
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    setIsPlaying(true);
  };

  const togglePlay = async () => {
    if (!player) {
      console.warn("Player is not initialized yet.");
      return;
    }

    if (isPlaying) {
      await player.pause();
      setIsPlaying(false);
    } else {
      await player.resume();
      setIsPlaying(true);
    }
  };

  const skipToNext = async () => {
    if (!player) {
      console.warn("Player is not initialized yet.");
      return;
    }

    await player.nextTrack();
  };

  const toggleShuffle = async () => {
    if (!deviceId) {
      console.warn("Device ID is not available yet. Please try again.");
      return;
    }

    try {
      await axios.put(
        `https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      console.log("Shuffle mode toggled.");
    } catch (error) {
      console.error("Failed to toggle shuffle:", error);
    }
  };

  const handleUploadPlaylist = async () => {
    if (!playlistName) {
      alert("Please enter a name for your playlist.");
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userId = userResponse.data.id;

      const createPlaylistResponse = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name: playlistName,
          description: "Generated with Playlist Pot",
          public: false
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      const playlistId = createPlaylistResponse.data.id;
      const trackUris = playlist.map(track => track.uri);

      for (let i = 0; i < trackUris.length; i += 100) {
        const urisChunk = trackUris.slice(i, i + 100);
        await axios.post(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          { uris: urisChunk },
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
      }

      setUploadStatus('Playlist uploaded successfully!');
    } catch (error) {
      console.error("Error uploading playlist:", error);
      setUploadStatus('Failed to upload playlist. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h1>Your Mixed Playlist</h1>
      <button onClick={onBack}>Back to Search</button>
      
      {playlist.length > 0 ? (
        <ul>
          {playlist.map((track, index) => (
            <li key={`${track.id || track.uri}-${index}`}>
              <button onClick={() => playTrack(track.uri)}>Play</button>
              <strong>{track.name}</strong> by {track.artists.map(artist => artist.name).join(', ')}
            </li>
          ))}
        </ul>
      ) : (
        <p>No tracks to display. Please go back and add items to your playlist.</p>
      )}

      <div>
        <input
          type="text"
          placeholder="Enter playlist name"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          disabled={isUploading}
        />
        <button onClick={handleUploadPlaylist} disabled={isUploading || !playlist.length}>
          {isUploading ? 'Uploading...' : 'Upload to Spotify'}
        </button>
        {uploadStatus && <p>{uploadStatus}</p>}
      </div>

      <div>
        <h2>Controls</h2>
        <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={skipToNext}>Next</button>
        <button onClick={toggleShuffle}>Shuffle</button>
      </div>

      {currentTrack && (
        <div>
          <h3>Now Playing</h3>
          <p><strong>{currentTrack.name}</strong> by {currentTrack.artists.map(artist => artist.name).join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export default PlaylistGeneratorPage;
