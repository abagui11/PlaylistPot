// src/App.js
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SearchPage from './components/SearchPage';
import PlaylistGeneratorPage from './components/PlaylistGeneratorPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSearch, setShowSearch] = useState(true); // Control search page display
  const [showPlaylist, setShowPlaylist] = useState(false); // Control playlist page display
  const [accessToken, setAccessToken] = useState(null);
  const [mixedPlaylist, setMixedPlaylist] = useState([]); // Store mixed playlist

  const handleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const authWindow = window.open(
      "http://localhost:3001/auth/login",
      "_blank",
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  useEffect(() => {
    const receiveMessage = (event) => {
      if (event.origin === "http://localhost:3001") {
        setAccessToken(event.data.accessToken);
        setIsLoggedIn(true);
        setShowSearch(true); // Show search page after login
        setShowPlaylist(false); // Ensure playlist page is hidden initially
      }
    };

    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, []);

  const handleSearch = (playlist) => {
    setMixedPlaylist(playlist); // Set the generated playlist
    setShowSearch(false);
    setShowPlaylist(true); // Show the Playlist Generator page
  };

  const handleBackToSearch = () => {
    setShowSearch(true); // Show the search page again
    setShowPlaylist(false); // Hide the playlist page
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : showSearch ? (
        <SearchPage onStartSearch={handleSearch} accessToken={accessToken} />
      ) : showPlaylist ? (
        // src/App.js
        <PlaylistGeneratorPage playlist={mixedPlaylist} onBack={handleBackToSearch} accessToken={accessToken} />
      ) : null}
    </div>
  );
}

export default App;
