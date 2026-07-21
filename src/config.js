// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001/api'
    : 'https://lab-app-backend.onrender.com/api');
