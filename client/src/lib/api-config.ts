export const getApiBaseUrl = () => {
  // In production (Vercel), use the Render backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, use relative path (proxied by Vite)
  return '/api';
};

export const BASE_URL = getApiBaseUrl();
