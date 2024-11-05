// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
console.log(process.env.STATUS); // Output: "production"

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const mixPlaylistRoutes = require('./routes/mix-playlist');

const app = express();

const allowedOrigins = [
    'http://localhost:3000',         // Development frontend
    'http://playlistpot.com',       // Production frontend
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
app.use(express.json()); // Add this line to parse JSON bodies

app.use('/api/auth', authRoutes);
app.use('/api', searchRoutes);
app.use('/api', mixPlaylistRoutes);

app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${PORT}`));
