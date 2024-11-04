// src/config.js
const BACKEND_URL =
    process.env.NODE_ENV === 'prod'
        ? 'http://localhost:3001'
        : 'http://54.147.156.144:8080';

export default BACKEND_URL;
