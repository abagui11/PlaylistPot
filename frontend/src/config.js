const BACKEND_URL =

    process.env.STATUS === 'development'
        ? 'http://localhost:3001'
        : 'https://api.playlistpot.com';

export default BACKEND_URL;
