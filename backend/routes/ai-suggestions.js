const express = require('express');
const axios = require('axios');
const router = express.Router();
const { encode } = require('gpt-3-encoder'); // Import the encoder
require('dotenv').config();

// Helper function to parse AI response
const parseSuggestions = (aiResponse) => {
  return aiResponse
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /\[Track\]|\[Album\]|\[Artist\]/i.test(line));
};

// POST route to handle AI suggestions
router.post('/ai-suggestions', async (req, res) => {
  const { prompt, playlist } = req.body;

  console.log('Received payload:', { prompt, playlist });

  if (!prompt || !Array.isArray(playlist)) {
    console.error('Validation failed:', { prompt, playlist });
    return res.status(400).json({ error: 'Prompt and a non-empty playlist are required.' });
  }

  try {
    const messages = [
      { role: 'system', content: 'You are an assistant helping to suggest music based on a set of artists, albums, songs, and user preferences.' },
      { role: 'user', content: playlist.length > 0 
      ? `Here is the current set of items: ${JSON.stringify(playlist)}. Based on this, ${prompt} and the current set of items which we will call "the pot", your output should be formatted as a list of suggestions to add to the pot and nothing more. First determine if you want your suggestions to be artist suggestions, album suggestions, track suggestions, or some mix of the above. Always put suggestions in the format [Track] "Song Title" by Artist Name format if it is a track; [Album] "Album Title" by Artist Name format if it is an album; [Artist] Artist Name format if it is an artist.`
      : `Based on the following user prompt: ${prompt} you should provide an output formatted as a list of suggestions and nothing more. First determine if you want your suggestions to be artist suggestions, album suggestions, track suggestions, or some mix of the above.  Always put suggestions in the format [Track] "Song Title" by Artist Name format if it is a track; [Album] "Album Title" by Artist Name format if it is an album; [Artist] Artist Name format if it is an artist.` },
    ];

    const totalTokens = messages.reduce((acc, msg) => acc + encode(msg.content).length, 0);
    let reducedPlaylist = [...playlist];

    if (totalTokens > 16000) {
      const maxPlaylistSize = Math.floor((16000 - encode(prompt).length) / encode(JSON.stringify(playlist[0])).length);
      reducedPlaylist = playlist.slice(0, maxPlaylistSize);
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: 'gpt-3.5-turbo', messages, max_tokens: 1000 },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const aiResponse = response.data.choices[0].message.content;
    const suggestions = parseSuggestions(aiResponse);

    // Backend: Log AI Suggestions
    console.log('AI Suggestions (raw):', suggestions);

    res.json({ suggestions });
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data);
      res.status(500).json({ error: 'Failed to fetch AI suggestions from OpenAI.' });
    } else {
      console.error('Unexpected Error:', error.message);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
});

module.exports = router;
