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

export default API;
