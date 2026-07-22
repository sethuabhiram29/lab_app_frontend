const getApiUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  }
  return 'https://lab-app-backend-e243.onrender.com/api';
};

export const API_BASE_URL = getApiUrl();
