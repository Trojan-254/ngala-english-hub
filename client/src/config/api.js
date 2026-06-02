const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const config = {
  apiUrl: API_URL,
  socketUrl: API_URL
};

export default config;
