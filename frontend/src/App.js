// src/App.js
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SearchPage from './components/SearchPage';
import PlaylistGeneratorPage from './components/PlaylistGeneratorPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [mixedPlaylist, setMixedPlaylist] = useState([]);

  // Determine the backend URL dynamically
  const BACKEND_URL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001'
      : 'https://playlist-pot.vercel.app';

  const handleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const authWindow = window.open(
      `${BACKEND_URL}/auth/login`, // Use dynamic backend URL
      '_blank',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  useEffect(() => {
    const receiveMessage = (event) => {
      if (event.origin === BACKEND_URL) { // Use dynamic backend URL
        setAccessToken(event.data.accessToken);
        setIsLoggedIn(true);
        setShowSearch(true);
        setShowPlaylist(false);
      }
    };

    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [BACKEND_URL]);

  const handleSearch = (playlist) => {
    setMixedPlaylist(playlist);
    setShowSearch(false);
    setShowPlaylist(true);
  };

  const handleBackToSearch = () => {
    setShowSearch(true);
    setShowPlaylist(false);
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : showSearch ? (
        <SearchPage onStartSearch={handleSearch} accessToken={accessToken} />
      ) : showPlaylist ? (
        <PlaylistGeneratorPage
          playlist={mixedPlaylist}
          onBack={handleBackToSearch}
          accessToken={accessToken}
        />
      ) : null}
    </div>
  );
}

export default App;
