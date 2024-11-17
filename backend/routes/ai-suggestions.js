const express = require('express');
const axios = require('axios');
const router = express.Router();
const { encode } = require('gpt-3-encoder'); // Import the encoder
require('dotenv').config();

// POST route to handle AI suggestions
router.post('/ai-suggestions', async (req, res) => {
  const { prompt, playlist } = req.body;

  console.log('Received payload:', { prompt, playlist }); // Log received data (remove later)

  if (!prompt || !playlist) {
    console.error('Validation failed:', { prompt, playlist }); // Log why validation fails
    return res.status(400).json({ error: 'Prompt and playlist are required.' });
  }

  try {
    const messages = [
      { role: 'system', content: 'You are an assistant helping to suggest music based on a playlist and user preferences.' },
      { role: 'user', content: `Here is the current playlist: ${JSON.stringify(playlist)}. Based on this, ${prompt}. Always put suggestions in "Song Title" by Artist Name format.` },
    ];
    
    const totalTokens = messages.reduce((acc, msg) => acc + encode(msg.content).length, 0);
    
    if (totalTokens > 16000) {
      // Dynamically reduce the playlist size to fit the token limit
      const maxPlaylistSize = Math.floor((16000 - encode(prompt).length) / encode(JSON.stringify(playlist[0])).length);
      playlist = playlist.slice(0, maxPlaylistSize);
    }
    

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: 'gpt-3.5-turbo', messages },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const aiResponse = response.data.choices[0].message.content;
    // Extract only song suggestions (assuming they are in list format)
    const suggestions = aiResponse
      .split('\n') // Split into lines
      .map(line => line.trim()) // Trim whitespace
      .filter(line => line && !line.toLowerCase().startsWith('based on') && !line.includes(':')) // Exclude commentary

    res.json({ suggestions });
  } catch (error) {
    console.error('Error communicating with ChatGPT API:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch AI suggestions.' });
  }
});


// router.post('/ai-suggestions', (req, res) => {
//   res.json({ message: 'Route is working!' });
// });


module.exports = router;
