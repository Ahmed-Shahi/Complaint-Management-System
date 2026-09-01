import axios from 'axios';

// Backend API URL (points to the deployed Express backend on Vercel)
const baseURL = import.meta.env.VITE_API_URL || 'https://cms-server-seven.vercel.app/api';

const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach Authorization header fallback for cross-domain Vercel deployment
API.interceptors.request.use(
  (config) => {
    // Extract userId from endpoint URL e.g., /users/64f1a2b3... or /auth/me/64f1a2b3...
    const match = config.url?.match(/\/(?:users|complaints|categories|auth\/me)\/([a-f0-9]{24})/i);
    const userId = match ? match[1] : null;

    if (userId) {
      const storedToken = sessionStorage.getItem(`cms_token_${userId}`);
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
        config.headers[`x-token-${userId}`] = storedToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
