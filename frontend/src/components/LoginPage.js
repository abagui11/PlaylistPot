// src/components/LoginPage.js
import React from 'react';

const LoginPage = ({ onLogin }) => {
  return (
    <div>
      <h1>Playlist Pot</h1>
      <h3>Throw your favorite artists, albums, and tracks into the pot and make a playlist out of them easily</h3>
      <button onClick={onLogin}>Login with Spotify</button>
    </div>
  );
};

export default LoginPage;
