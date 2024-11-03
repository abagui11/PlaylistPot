// src/components/LoginPage.js
import React from 'react';

const LoginPage = ({ onLogin }) => {
  return (
    <div>
      <h1>Login to Spotify</h1>
      <button onClick={onLogin}>Login with Spotify</button>
    </div>
  );
};

export default LoginPage;
