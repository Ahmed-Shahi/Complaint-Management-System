import axios from 'axios';

// Base API configuration with credentials enabled for Token_<userId> cookies
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default API;
