import '../styles/LoginPage.css';
import spotifyLogo from 'frontend/src/assets/spotify_logo.png';
import React from 'react';

const LoginPage = ({ onLogin }) => {
  return (
    <div className="login-container">
      <h1>Playlist Pot</h1>
      <h3>Make playlists easily</h3>
      <button className="spotify-button" onClick={onLogin}>
        <img src={spotifyLogo} alt="Spotify Logo" />
        Sign in with Spotify
      </button>
    </div>
  );
};

export default LoginPage;
