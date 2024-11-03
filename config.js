// src/config.js
const config = {
    development: {
      BACKEND_URL: 'http://localhost:3001',
      FRONTEND_URL: 'http://localhost:3000',
    },
    production: {
      BACKEND_URL: 'https://playlist-pot.vercel.app',
      FRONTEND_URL: 'https://playlist-pot.vercel.app',
    },
  };
  
  // Automatically export the correct configuration based on the NODE_ENV
  export default config[process.env.NODE_ENV || 'development'];
  