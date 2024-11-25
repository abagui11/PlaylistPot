import '../styles/SearchPage.css';
import React, { useState } from 'react';
import axios from 'axios';

const SearchPage = ({ onStartSearch, accessToken }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filter, setFilter] = useState('artist');
  const [playlistSize, setPlaylistSize] = useState(20);

  const [popularity, setPopularity] = useState(50); // Retain only popularity
  const [isPopularityEnabled, setIsPopularityEnabled] = useState(false); // Checkbox to enable/disable popularity filter

  //const BACKEND_URL = "http://localhost:3001"; // Change for production
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
      alert('Please add items to the pot to create a playlist.');
      return;
    }

    try {
      const payload = {
        selectedItems,
        playlistSize,
        // Include popularityValue only if the filter is enabled
        ...(isPopularityEnabled && { popularityValue: popularity }), // Only include popularity if enabled
      };

      console.log('Mix Playlist Payload:', payload);

      const response = await axios.post(
        `${BACKEND_URL}/api/mix-playlist`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const mixedPlaylist = response.data.tracks;
      onStartSearch(mixedPlaylist);
    } catch (error) {
      console.error('Error generating mixed playlist:', error);
      alert(
        'Failed to generate playlist. Please adjust playlist size or add more items to the pot.'
      );
    }
  };

  return (
    <div className="content-wrapper">
      <div className="search-header">
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
          <button onClick={handleMixPlaylist}>MIX</button>
        </div>

        <div className="search-container">
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

        {/* Advanced Tools Section */}
        <div className="advanced-tools">
          <div className="audio-feature-group">
            <label>
              <input
                type="checkbox"
                checked={isPopularityEnabled}
                onChange={() => setIsPopularityEnabled(!isPopularityEnabled)}
              />
              Normie Slider
            </label>
            <div className="popularity-slider" style={{ display: isPopularityEnabled ? 'block' : 'none' }}>
              <div className="slider-labels">
                <span>Niche</span>
                <span>Normie</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={popularity}
                onChange={(e) => setPopularity(parseInt(e.target.value))}
                disabled={!isPopularityEnabled}
              />
              <span>{popularity}th percentile</span>
            </div>
          </div>
        </div>

        <div className="results-container">
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
                <button onClick={() => handleRemoveItem(index)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
