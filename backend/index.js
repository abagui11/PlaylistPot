// index.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const mixPlaylistRoutes = require('./routes/mix-playlist');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json()); // Add this line to parse JSON bodies

app.use('/auth', authRoutes);
app.use(searchRoutes);
app.use(mixPlaylistRoutes);

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
