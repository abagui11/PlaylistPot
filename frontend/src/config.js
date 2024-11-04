const BACKEND_URL =

    process.env.STATUS === 'development'
        ? 'http://localhost:3001'
        : 'http://54.147.156.144:8080';

export default BACKEND_URL;
