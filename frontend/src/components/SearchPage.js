// src/components/SearchPage.js
import React, { useState } from 'react';
import axios from 'axios';

const SearchPage = ({ onStartSearch, accessToken }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filter, setFilter] = useState('artist');
  const [playlistSize, setPlaylistSize] = useState(50);
  //const BACKEND_URL="http://localhost:3001"; // Change for production
  const BACKEND_URL="https://api.playlistpot.com";
  

  const handleSearch = async () => {
    if (!query) return;

    try {
      const response = await axios.get(`${BACKEND_URL}/api/search`, {
        params: { query, type: filter },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Log the entire response data to inspect its structure
      console.log("API Response:", response.data);

      if (filter === 'artist') {
        setResults(response.data.artists.items || []);
      } else if (filter === 'album') {
        setResults(response.data.albums.items || []);
      } else if (filter === 'track') {
        setResults(response.data.tracks.items || []);
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItems([...selectedItems, item]);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
  };

  const handleMixPlaylist = async () => {
    if (selectedItems.length === 0) {
      alert("Please add items to the pot to create a playlist.");
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/mix-playlist`, {
        selectedItems,
        playlistSize,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const mixedPlaylist = response.data.tracks;
      onStartSearch(mixedPlaylist);
    } catch (error) {
      console.error("Error generating mixed playlist:", error);
      alert("Failed to generate playlist. Please adjust playlist size or add more items to the pot.");
    }
  };

  return (
    <div>
      <h1>Search for Artists, Albums, or Tracks</h1>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div>
        <label>Filter by: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="artist">Artist</option>
          <option value="album">Album</option>
          <option value="track">Track</option>
        </select>
      </div>

      <button onClick={handleSearch}>Search</button>

      <div>
        <h2>Results</h2>
        <ul>
          {results.map((item) => (
            <li key={item.id}>
              {item.name} - {item.type}
              <button onClick={() => handleSelectItem(item)}>Add to Pot</button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Your Pot</h2>
        <ul>
          {selectedItems.map((item, index) => (
            <li key={index}>
              {item.name} - {item.type}
              <button onClick={() => handleRemoveItem(index)}>Remove</button> {/* Remove button */}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label>Number of tracks:</label>
        <input
          type="range"
          min="0"
          max="500"
          value={playlistSize}
          onChange={(e) => setPlaylistSize(parseInt(e.target.value))}
        />
        <span>{playlistSize}</span>
      </div>

      <button onClick={handleMixPlaylist}>Mix Playlist</button>
    </div>
  );
};

export default SearchPage;
