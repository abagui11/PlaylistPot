import '../styles/PlaylistGeneratorPage.css';
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
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [updatedPlaylist, setUpdatedPlaylist] = useState(playlist || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playlistQuery, setPlaylistQuery] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [averagePopularity, setAveragePopularity] = useState(0);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const BACKEND_URL = "http://localhost:3001"; // Update for production
  //const BACKEND_URL = "https://api.playlistpot.com"; // Update for production

  // Calculate average popularity dynamically
  useEffect(() => {
    if (updatedPlaylist.length === 0) {
      setAveragePopularity(0); // No tracks, set to 0
    } else {
      const totalPopularity = updatedPlaylist.reduce((sum, track) => sum + (track.popularity || 0), 0);
      const avg = totalPopularity / updatedPlaylist.length;
      setAveragePopularity(avg.toFixed(2)); // Set with two decimal places
    }
  }, [updatedPlaylist]);

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
        volume: 0.5,
      });
    
      newPlayer.addListener('ready', async ({ device_id }) => {
        setDeviceId(device_id);
        console.log("Spotify Player ready with Device ID:", device_id);
    
        // Transfer playback to the Web Playback SDK's device with retry logic
        let retries = 3;
        while (retries > 0) {
          try {
            await axios.put(
              'https://api.spotify.com/v1/me/player',
              { device_ids: [device_id], play: false },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            console.log("Playback transferred to the Web Playback SDK");
            break;
          } catch (error) {
            retries--;
            console.warn(`Failed to transfer playback. Retries left: ${retries}`);
            if (retries === 0) {
              console.error("Could not transfer playback after multiple retries:", error.response?.data || error.message);
            }
          }
        }
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
    if (!deviceId) {
      console.warn("Device ID not available yet.");
      return;
    }
  
    let retries = 3;
    while (retries > 0) {
      try {
        await axios.put(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            uris: updatedPlaylist.map(track => track.uri),
            offset: { uri: trackUri },
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        console.log(`Playing track: ${trackUri}`);
        setIsPlaying(true);
        break;
      } catch (error) {
        retries--;
        console.warn(`Failed to play track. Retries left: ${retries}`);
        if (retries === 0) {
          console.error("Could not play track after multiple retries:", error.response?.data || error.message);
        }
      }
    }
  };
  

  const togglePlay = async () => {
    if (!player) {
      console.warn("Player is not initialized yet.");
      return;
    }
  
    try {
      if (isPlaying) {
        await player.pause();
        setIsPlaying(false);
        console.log("Playback paused.");
      } else {
        await player.resume();
        setIsPlaying(true);
        console.log("Playback resumed.");
      }
    } catch (error) {
      console.error("Error toggling playback:", error.response?.data || error.message);
    }
  };
  
  const skipToNext = async () => {
    if (!player) {
      console.warn("Player is not initialized yet.");
      return;
    }
  
    try {
      await player.nextTrack();
      console.log("Skipped to next track.");
    } catch (error) {
      console.error("Error skipping to next track:", error.response?.data || error.message);
    }
  };
  
  const toggleShuffle = async () => {
    if (!deviceId) {
      console.warn("Device ID is not available yet.");
      return;
    }
  
    try {
      await axios.put(
        `https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      console.log("Shuffle mode toggled.");
    } catch (error) {
      console.error("Failed to toggle shuffle:", error.response?.data || error.message);
    }
  };


  
  

  const handleUploadPlaylist = async () => {
    const validTracks = updatedPlaylist.filter(track => track.uri && track.uri.startsWith('spotify:track:'));

    if (validTracks.length === 0) {
      alert('Your playlist does not contain any valid Spotify tracks to upload.');
      return;
    }

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
      const trackUris = updatedPlaylist.map(track => track.uri);

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

  // Handle AI Prompt Submission
  const handleAiPromptSubmit = async () => {
    if (!aiPrompt) {
      console.error("AI Prompt cannot be empty");
      return;
    }

    // Calculate the approximate token usage
  const estimatedTokens = JSON.stringify(playlist).length + aiPrompt.length;
  const tokenLimit = 60000; // Adjust this based on your chosen model

  // Check if the input exceeds the token limit
  if (estimatedTokens > tokenLimit) {
    alert(
      `Zoinks. Your playlist is too large for the AI to process and make recs for (translated: I am too broke to afford a more powerful model.)\n\n` +
      `Please reduce your playlist size or shorten your prompt. Current estimated token usage: ${estimatedTokens} (Limit: ${tokenLimit})`
    );
    return;
  }

    const summarizedPlaylist = updatedPlaylist.slice(0, 5).map(track => ({
      name: track.name,
      artist: track.artists?.[0]?.name, // Only include the first artist's name
    }));
    
    const payload = { prompt: aiPrompt, playlist: summarizedPlaylist };
    console.log('Payload being sent:', payload);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-suggestions`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('AI Suggestions response:', response.data);
       // Ensure suggestions is an array
      let suggestions = response.data.suggestions;
      if (typeof suggestions === 'string') {
        // Split string into array based on newline or specific delimiter
        suggestions = suggestions.split('\n').filter((line) => line.trim() !== '');
      }

      setAiSuggestions(suggestions); // Update state with the parsed array
      
    } catch (error) {
      console.error('Error hitting AI Suggestions endpoint:', error.response?.data || error.message);
      alert('Failed to get suggestions. Please try again.');
    }
    
  };

  const addSuggestionToPlaylist = async (suggestion) => {
    // Clean up the suggestion string
    const cleanedSuggestion = suggestion
        .replace(/^\d+\.\s*/, '') // Remove leading numbering like "1. "
        .replace(/["“”']/g, '') // Remove quotes or special characters around the title
        .trim(); // Remove extra whitespace

    console.log('Cleaned Suggestion:', cleanedSuggestion);

    // Split the suggestion into track name and artist
    const parts = cleanedSuggestion.split(/\s+by\s+/i); // Split on " by " (case-insensitive)
    if (parts.length !== 2) {
        console.error('Invalid suggestion format:', suggestion);
        alert('Failed to parse suggestion format. Please try another.');
        return;
    }

    const [name, artist] = parts.map((part) => part.trim()); // Trim each part
    console.log('Parsed Name:', name);
    console.log('Parsed Artist:', artist);

    try {
        // Search Spotify for the track
        const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
            params: {
                q: `track:${name} artist:${artist}`,
                type: 'track',
                limit: 1,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const track = searchResponse.data.tracks.items[0];
        if (!track) {
            alert(`Could not find a match for "${name}" by ${artist} on Spotify.`);
            return;
        }

        // Use the full track details to match the existing playlist structure
        console.log('Full track details fetched:', track);

        // Safely update playlist and remove suggestion
        setUpdatedPlaylist((prevPlaylist) => {
            const newPlaylist = [...prevPlaylist, track]; // Add the full track object
            console.log('Updated playlist:', newPlaylist);
            return newPlaylist;
        });

        setAiSuggestions((prevSuggestions) => {
            const newSuggestions = prevSuggestions.filter((item) => item !== suggestion);
            console.log('Remaining suggestions:', newSuggestions);
            return newSuggestions;
        });

        console.log('Track added successfully:', track);
    } catch (error) {
        console.error('Error adding track:', error.response?.data || error.message);
        alert('Failed to add track. Please try again.');
    }
};


  // Search for songs
  const searchSongs = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query.');
      return;
    }

    try {
      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: searchQuery,
          type: 'track',
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setSearchResults(response.data.tracks.items || []);
      console.log('Search results:', response.data.tracks.items);
    } catch (error) {
      console.error('Error searching songs:', error.response?.data || error.message);
      alert('Failed to search for songs. Please try again.');
    }
  };

  // Add a searched song to the playlist
  const addSearchedSongToPlaylist = (track) => {
    setUpdatedPlaylist((prevPlaylist) => {
      const newPlaylist = [...prevPlaylist, track];
      console.log('Updated playlist after adding searched song:', newPlaylist);
      return newPlaylist;
    });
  };

  // Delete a song from the playlist
  const deleteSongFromPlaylist = (trackUri) => {
    setUpdatedPlaylist((prevPlaylist) => {
      const newPlaylist = prevPlaylist.filter((track) => track.uri !== trackUri);
      console.log('Updated playlist after deletion:', newPlaylist);
      return newPlaylist;
    });
  };

  // Fetch user's Spotify playlists
  const fetchUserPlaylists = async () => {
    if (!playlistQuery.trim()) return;

    try {
      setLoading(true);
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 50 },
      });
      console.log('Raw API response:', response.data.items);

      const filteredPlaylists = response.data.items
        .filter((playlist) => playlist?.name) // Ensure playlist has a name
        .filter((playlist) =>
          playlist.name.toLowerCase().includes(playlistQuery.toLowerCase())
    );

      setPlaylists(filteredPlaylists);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user playlists:', error.response?.data || error.message);
      setLoading(false);
    }
  };

  // Fetch tracks from a specific playlist
  const fetchPlaylistTracks = async (playlistId) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 100 },
      });

      const tracks = response.data.items.map(item => item.track);
      setPlaylistTracks(tracks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error.response?.data || error.message);
      setLoading(false);
    }
  };

  // Add all tracks from the fetched playlist to the current playlist
  const handleAddAllTracks = () => {
    setUpdatedPlaylist((prev) => [...prev, ...playlistTracks]);
    setPlaylistTracks([]); // Clear the suggestions
  };

  // Add an individual track from the fetched playlist
  const addFetchedTrackToPlaylist = (track) => {
    setUpdatedPlaylist((prev) => [...prev, track]);
    setPlaylistTracks((prev) => prev.filter(t => t.uri !== track.uri));
  };

  // Render Search Playlists Section
const renderSearchPlaylistsSection = () => (
  <div className="search-section">
      <h2>Search and Add from Playlists</h2>
      <div className="input-button-wrapper">
        <input
          type="text"
          placeholder="Search for a playlist"
          value={playlistQuery}
          onChange={(e) => setPlaylistQuery(e.target.value)}
        />
        <button onClick={fetchUserPlaylists} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {playlists.length > 0 ? (
        <select
          onChange={(e) => setSelectedPlaylist(e.target.value)}
          value={selectedPlaylist || ''}
          className="playlist-dropdown"
        >
          <option value="" disabled>Select a Playlist</option>
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name}
            </option>
          ))}
        </select>
      ) : (
        searchAttempted && (
          <p className="no-playlists-message">
            No playlists found. Try a different search.
          </p>
        )
      )}

      {selectedPlaylist && (
        <button onClick={() => fetchPlaylistTracks(selectedPlaylist)} disabled={loading}>
          {loading ? 'Loading Tracks...' : 'Load Playlist Tracks'}
        </button>
      )}

      {playlistTracks.length > 0 && (
        <div>
          <h3>Tracks in Playlist</h3>
          <button onClick={handleAddAllTracks}>Add All</button>
          <ul>
            {playlistTracks.map((track) => (
              <li key={track.uri}>
                <button onClick={() => addFetchedTrackToPlaylist(track)}>+</button>
                <strong>{track.name}</strong> by {track.artists.map(artist => artist.name).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
);

  return (
    <div className = "content-wrapper">
      <button onClick={onBack} className="back-button">Back</button>

       {/* Search Feature */}
       <div className = "search-section">
        <h2>Search songs to add</h2>
        <div className="input-button-wrapper">
          <input
            type="text"
            placeholder="Search for a song"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={searchSongs}>Search</button>
        </div>
        {searchResults.length > 0 && (
          <div>
            <h2>Search Results</h2>
            <ul>
              {searchResults.map((track) => (
                <li key={track.uri}>
                  <button onClick={() => addSearchedSongToPlaylist(track)}>+</button>
                  <strong>{track.name}</strong> by {track.artists.map(artist => artist.name).join(', ')}
                  
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Download personal playlist section */}
      {renderSearchPlaylistsSection()}


      <div className = "the-pot">

        {/* Clear Playlist Button */}
        <div className="playlist-header">
          <h1>Your Mixed Playlist</h1>
          <button
              onClick={() => setUpdatedPlaylist([])}
              className="clear-playlist-button"
            >
              Clear Playlist
          </button>
        </div>
        {/* Mixed Playlist Section */}
        {updatedPlaylist.length > 0 ? (
          <ul>
            {updatedPlaylist.map((track, index) => (
              <li key={`${track.uri}-${index}`}>
                <button onClick={() => playTrack(track.uri)}>Play</button>
                <button onClick={() => deleteSongFromPlaylist(track.uri)}>X</button>
                <strong>{track.name}</strong> by {track.artists.map(artist => artist.name).join(',  ')}
              </li>
            ))}
          </ul>
        ) : (
          <p>No tracks to display. Please go back and add items to your playlist.</p>
        )}
      </div>
      
      {/* Controls Section */}
      <div className = "controls-now-playing-container">
        <div>
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

      {/* Average Popularity Section */}
      <div className="average-popularity-section">
        <h2>Normie Score</h2>
        <p>
          This playlist is in the {' '}
          <strong>{averagePopularity}</strong>
          th percentile of mainstream-ness.
        </p>

        <p>
          {averagePopularity <= 30
            ? "Are these even real songs?"
            : averagePopularity <= 50
            ? "Sufficiently niche."
            : averagePopularity <= 75
            ? "You probably think you have good music taste"
            : "Normal and probably mentally stable"}
        </p>
      </div>


      <div className = "upload-section">
        <h2> Upload your playlist to your Spotify </h2>
        <div className="input-button-wrapper">
          <input
            type="text"
            placeholder="Enter playlist name"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            disabled={isUploading}
          />
          <button onClick={handleUploadPlaylist} disabled={isUploading || !playlist.length}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploadStatus && <p>{uploadStatus}</p>}
      </div>
      
    </div>
    
  );
};

export default PlaylistGeneratorPage;