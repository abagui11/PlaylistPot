// index.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const mixPlaylistRoutes = require('./routes/mix-playlist');

const app = express();
//const PORT = process.env.NODE_ENV === 'development' ? process.env.DEV_PORT: process.env.PROD_PORT;
const PORT = 8080;
//const PORT = 3001;

app.use(cors());
app.use(express.json()); // Add this line to parse JSON bodies

app.use('/api/auth', authRoutes);
app.use('/api', searchRoutes);
app.use('/api', mixPlaylistRoutes);

app.listen(PORT, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${PORT}`));
