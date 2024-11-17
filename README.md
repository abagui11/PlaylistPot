# Spotify Playlist Mixer

A Spotify-connected web application where users can "throw" artists, albums, and songs into a pot to generate a mixed playlist. Users can play the generated playlist through the app or upload it to their Spotify account.

## Features
- Search for artists, albums, or songs and add them to a "pot"
- Generate a playlist with the selected items
- Listen to the playlist in-app or on Spotify
- Discover new music from favorite artists

## Tech Stack
- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express, Axios
- **Spotify API**: OAuth for user authentication, search, and playlist creation
- **Deployment**: Vercel (frontend) and Heroku or Railway (backend)

## Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/)
- A [Spotify Developer Account](https://developer.spotify.com/) to obtain client credentials

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/spotify-playlist-mixer.git
cd spotify-playlist-mixer

### Roadmap
[X] Adding AI feature to modify playlists
- Add picture mechanism to create playlist based off picture
- ability to time capsule back to a specific period in your liked songs (or maybe just a liked songs organizer)
