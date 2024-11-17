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
  const [aiPrompt, setAiPrompt] = useState(''); // For user input AI prompt
  const [aiSuggestions, setAiSuggestions] = useState([]); // To store AI suggestions
  const [updatedPlaylist, setUpdatedPlaylist] = useState(playlist || []); // For dynamically updating the playlist
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query
  const [searchResults, setSearchResults] = useState([]); // New state for search results

  //const BACKEND_URL = "http://localhost:3001"; // Update for production
  const BACKEND_URL = "https://api.playlistpot.com"; // Update for production

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

  const preloadTrack = async (trackUri) => {
    if (!deviceId) return;
  
    try {
      await axios.put(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          uris: [trackUri],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      console.log(`Track preloaded: ${trackUri}`);
    } catch (error) {
      console.error("Error preloading track:", error.response?.data || error.message);
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
      .replace(/["']/g, ''); // Remove quotes around the title
  
    const parts = cleanedSuggestion.split(' by ');
    if (parts.length !== 2) {
      console.error('Invalid suggestion format:', suggestion);
      alert('Failed to parse suggestion format. Please try another.');
      return;
    }
  
    const [name, artist] = parts.map((part) => part.trim());
  
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
  
  
  
  


  return (
    <div>
      <h1>Your Mixed Playlist</h1>
      <button onClick={onBack}>Back to Search</button>
      
      {updatedPlaylist.length > 0 ? (
        <ul>
          {updatedPlaylist.map((track, index) => (
            <li key={`${track.uri}-${index}`}>
              <button onClick={() => playTrack(track.uri)}>Play</button>
              <strong>{track.name}</strong> by {track.artists.map(artist => artist.name).join(', ')}
              <button onClick={() => deleteSongFromPlaylist(track.uri)}>Delete</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No tracks to display. Please go back and add items to your playlist.</p>
      )}

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
       {/* Search Feature */}
       <div>
        <h2>Search Songs</h2>
        <input
          type="text"
          placeholder="Search for a song"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={searchSongs}>Search</button>
        {searchResults.length > 0 && (
          <div>
            <h3>Search Results</h3>
            <ul>
              {searchResults.map((track) => (
                <li key={track.uri}>
                  <strong>{track.name}</strong> by {track.artists.map(artist => artist.name).join(', ')}
                  <button onClick={() => addSearchedSongToPlaylist(track)}>Add</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI Feature */}
      <div>
        <h2>ooh aah artificial intelligence</h2>
        <input
          type="text"
          placeholder="Add some jazz"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button onClick={handleAiPromptSubmit}>Submit</button>
      </div>

      {aiSuggestions.length > 0 && (
        <div>
          <h3>Suggested Additions</h3>
          <ul>
            {aiSuggestions.map((item, index) => (
              <li key={index}>
                {item}
                <button onClick={() => addSuggestionToPlaylist(item)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
      )}


      <div>
        <h2> Upload your playlist to your Spotify </h2>
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
      
    </div>
    
  );
};

export default PlaylistGeneratorPage;