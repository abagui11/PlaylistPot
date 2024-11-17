// index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const mixPlaylistRoutes = require('./routes/mix-playlist');
const aiSuggestions = require('./routes/ai-suggestions');

const app = express();

const allowedOrigins = [
    'http://localhost:3000',         // Development frontend
    'https://playlistpot.com',       // Production frontend
    'https://www.playlistpot.com' 
  ];

const PORT = process.env.STATUS === 'development' ? process.env.DEV_PORT: process.env.PROD_PORT;


app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

// Preflight requests handling
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

// Use body-parser with increased limit
app.use(bodyParser.json({ limit: '10mb' })); // Adjust limit as needed
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api', searchRoutes);
app.use('/api', mixPlaylistRoutes);
app.use('/api', aiSuggestions);

app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${PORT}`));

app._router.stack.forEach((middleware) => {
  if (middleware.route) {
      // This is a route middleware
      console.log(`Registered route: ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
      // This is a router middleware
      middleware.handle.stack.forEach((route) => {
          if (route.route) {
              console.log(`Registered route: ${route.route.path}`);
          }
      });
  }
});


