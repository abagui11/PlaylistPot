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
  const [isLoading, setIsLoading] = useState(false);
  //const BACKEND_URL="http://localhost:3001"; // Change for production
  const BACKEND_URL="https://api.playlistpot.com";
  

  const handleLogin = () => {
  setIsLoading(true);
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  const loginPopup = window.open(
    `${BACKEND_URL}/api/auth/login`, // Use dynamic backend URL
    '_blank',
    `width=${width},height=${height},top=${top},left=${left}`
  );

  if (!loginPopup || loginPopup.closed || typeof loginPopup.closed === 'undefined') {
    // Popup blocked or failed, fallback to redirect
    setIsLoading(false);
    window.location.href = `${BACKEND_URL}/api/auth/login`;
  }
};

useEffect(() => {
  const receiveMessage = (event) => {
    if (event.origin === BACKEND_URL) { // Use dynamic backend URL
      setAccessToken(event.data.accessToken);
      setIsLoggedIn(true);
      setShowSearch(true);
      setShowPlaylist(false);
      setIsLoading(false);
    }
  };

  window.addEventListener('message', receiveMessage);
  return () => window.removeEventListener('message', receiveMessage);
}, []);


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
  isLoading ? (
    <div>Loading...</div>
  ) : (
    <LoginPage onLogin={handleLogin} />
  )
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
