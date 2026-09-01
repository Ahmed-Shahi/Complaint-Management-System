import axios from 'axios';

// Base API configuration
// In local dev mode, uses http://localhost:5000/api
// In Vercel production deployment, routes to relative /api
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'https://cms-server-seven.vercel.app/api' : '/api');

const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default API;
