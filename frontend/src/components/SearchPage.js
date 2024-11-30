import '../styles/SearchPage.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchPage = ({ onStartSearch, accessToken }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [filter, setFilter] = useState('artist');
  const [playlistSize, setPlaylistSize] = useState(20);

  const [placeholder, setPlaceholder] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const suggestions = [
    "Give me some recs to make the pot less mainstream.",
    "Help I'm on aux - give me a nice house and rap party playlist",
    "What are some albums that fit the current vibe of the pot?",
    "I want to give this pot a more 80s flavor, what are your recs?",
  ];


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
    // Remove the selected item from the results
    setResults((prevResults) => prevResults.filter((result) => result.id !== item.id));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
  };

  // Handle AI Prompt Submission
  const handleAiPromptSubmit = async () => {
    if (!aiPrompt) {
      console.error("AI Prompt cannot be empty");
      return;
    }
  
    const estimatedTokens = JSON.stringify(selectedItems).length + aiPrompt.length;
    const tokenLimit = 60000;
  
    if (estimatedTokens > tokenLimit) {
      alert(
        `Zoinks. Your pot is too large for the AI to process and make recs for.\n` +
        `Please reduce your pot size or shorten your prompt. Estimated token usage: ${estimatedTokens} (Limit: ${tokenLimit}).`
      );
      return;
    }
  
    const payload = { prompt: aiPrompt, playlist: selectedItems };
  
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-suggestions`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      

  
      let suggestions = response.data.suggestions;
      if (typeof suggestions === 'string') {
        suggestions = suggestions.split('\n').filter((line) => line.trim() !== '');
      }

      // Frontend: Log response from AI endpoint
    console.log('AI Suggestions response (before standardization)):', suggestions);
  
      // Parse AI suggestions into the same format as search results
      const standardizedSuggestions = await Promise.all(
        suggestions.map(async (suggestion, index) => {
          // Extract the type and cleaned name from the suggestion
          const typeMatch = suggestion.match(/^\[([^\]]+)\]/); // Extract type in brackets [Type]
          const suggestionType = typeMatch ? typeMatch[1].toLowerCase() : null; // Convert to lowercase for easier comparison
          const cleanedSuggestion = suggestion
            .replace(/^\[([^\]]+)\]\s*/, '') // Remove [Type] at the start
            .replace(/^\d+\.\s*/, '') // Remove numbering like "1. "
            .replace(/["“”']/g, '') // Remove quotes
            .trim();
      
          if (!suggestionType) {
            console.warn(`No type found in suggestion: ${suggestion}`);
            return { id: `ai-${index}`, name: cleanedSuggestion, type: 'unknown' };
          }
      
          try {
            // Perform Spotify API search based on the extracted type
            const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
              params: {
                q: cleanedSuggestion,
                type: suggestionType === 'track' ? 'track' : suggestionType === 'album' ? 'album' : 'artist',
                limit: 1,
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            });
      
            const { tracks, artists, albums } = searchResponse.data;
      
            // Match results based on the specified type
            if (suggestionType === 'track' && tracks.items.length > 0) {
              console.log(`AI Suggestion matched as track: ${cleanedSuggestion}`);
              return { id: tracks.items[0].id, name: tracks.items[0].name, type: 'track' };
            } else if (suggestionType === 'album' && albums.items.length > 0) {
              console.log(`AI Suggestion matched as album: ${cleanedSuggestion}`);
              return { id: albums.items[0].id, name: albums.items[0].name, type: 'album' };
            } else if (suggestionType === 'artist' && artists.items.length > 0) {
              console.log(`AI Suggestion matched as artist: ${cleanedSuggestion}`);
              return { id: artists.items[0].id, name: artists.items[0].name, type: 'artist' };
            }
      
            // Fallback if no matches found
            console.warn(`No match found for suggestion: ${cleanedSuggestion} (${suggestionType})`);
            return { id: `ai-${index}`, name: cleanedSuggestion, type: 'unknown' };
          } catch (error) {
            console.error(`Error processing suggestion "${cleanedSuggestion}" (${suggestionType}):`, error.message);
            return { id: `ai-${index}`, name: cleanedSuggestion, type: 'unknown' }; // Handle errors gracefully
          }
        })
      );
      

      setResults(standardizedSuggestions); // Replace results with AI suggestions

       // Frontend: Log response from AI endpoint
    console.log('AI Suggestions response (raw):', standardizedSuggestions);


      
    } catch (error) {
      console.error('Error hitting AI Suggestions endpoint:', error.response?.data || error.message);
      alert('Failed to get suggestions. Please try again.');
    }
  };
  


  const handleMixPlaylist = async () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the pot to create a playlist.');
      return;
    }

    try {
      const payload = {
        selectedItems,
        playlistSize
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

  useEffect(() => {
    if (aiPrompt || isUserTyping) return; // Stop animation if user types

    let typingTimeout;
    let deletingTimeout;
    let pauseTimeout;

    const typePlaceholder = (text, index = 0) => {
      if (index < text.length) {
        setPlaceholder((prev) => prev + text[index]); // Add one character at a time
        typingTimeout = setTimeout(() => typePlaceholder(text, index + 1), 25); // Typing speed
      } else {
        // Pause before moving to deletion
        pauseTimeout = setTimeout(() => deletePlaceholder(text.length), 3000); // Pause for 2 seconds
      }
    };

    const deletePlaceholder = (length) => {
      if (length > 0) {
        setPlaceholder((prev) => prev.slice(0, -1)); // Remove one character at a time
        deletingTimeout = setTimeout(() => deletePlaceholder(length - 1), 5); // Deleting speed
      } else {
        // Move to the next suggestion
        setCurrentIndex((prev) => (prev + 1) % suggestions.length); // Loop back to start
      }
    };

    // Start typing the current suggestion
    typePlaceholder(suggestions[currentIndex]);

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(deletingTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [currentIndex, aiPrompt, isUserTyping]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setAiPrompt(value);
    setIsUserTyping(value !== ''); // Detect if the user is typing
  };

  


  return (
    <div className="content-wrapper">
      
      <div className="mix-section">
        <label htmlFor="playlist-size">Set playlist size:</label>
        <input
          id="playlist-size"
          type="number"
          min="1"
          max="150"
          value={playlistSize}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (value < 1) {
              alert('Please increase the playlist size. The minimum size is 1.');
              setPlaylistSize(1); // Reset to minimum
            } else if (value > 150) {
              alert('The maximum playlist size is 150.');
              setPlaylistSize(150); // Reset to maximum
            } else {
              setPlaylistSize(value);
            }
          }}
        />
        <button onClick={handleMixPlaylist}>MIX</button>
      </div>


      <div className="search-container">
        <h1>Add Artists, Albums, or Tracks to Pot</h1>

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

      <div className="ai-container">
        <h1>AI Suggestions</h1>

        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder={placeholder} // Animated placeholder text
            value={aiPrompt}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleAiPromptSubmit()}
            onFocus={() => setIsUserTyping(true)} // Stop animation on focus
            onBlur={() => setIsUserTyping(aiPrompt !== '')} // Resume if input is empty
          />
          <button onClick={handleAiPromptSubmit}>Submit</button>
        </div>
        
      </div>
      
      
        
        <div className="results-pot-container">

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

          <div className="pot-container">
            <h2>Your Pot</h2>
            <ul>
              {selectedItems.map((item, index) => (
                <li key={index}>
                  {item.name} - {item.type}
                  <button onClick={() => handleRemoveItem(index)}>x</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    
  );
};

export default SearchPage;
