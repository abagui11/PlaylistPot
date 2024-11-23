import '../styles/SearchPage.css';
import React, { useState } from 'react';
import axios from 'axios';

const SearchPage = ({ onStartSearch, accessToken }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filter, setFilter] = useState('artist');
  const [playlistSize, setPlaylistSize] = useState(20);
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
    <div className = "search-header">
      <div className = "search-container"> 
        <h1>Search for Artists, Albums, or Tracks</h1>

        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div>
          <label>Filter by: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="artist">Artist</option>
            <option value="album">Album</option>
            <option value="track">Track</option>
          </select>
        </div>
      </div>
      

      <div className = "results-container">
        <h2>Results</h2>
        <ul>
          {results.map((item) => (
            <li key={item.id}>
              {item.name} - {item.type}
              <button onClick={() => handleSelectItem(item)}>+</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="results-container">
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

      <div className="slider-container">
        <label>Number of tracks:</label>
        <input
          type="range"
          min="0"
          max="150"
          value={playlistSize}
          onChange={(e) => {
            const value = e.target.value;
            e.target.style.setProperty('--value', `${(value / 150) * 100}%`);
            setPlaylistSize(parseInt(value));
          }}
          style={{ '--value': `${(20 / 150) * 100}%` }} // Set the initial value to 20
        />
        <span>{playlistSize}</span>
        <button onClick={handleMixPlaylist}>Mix</button>
      </div>

      
    </div>
  );
};

export default SearchPage;
