// src/config.js
const BACKEND_URL =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : 'https://playlist-pot.vercel.app';

export default BACKEND_URL;
