// Where the Express API lives.
// Production (Vercel): VITE_API_URL points at the Render service. It may be
// set with or without a trailing slash or "/api"; both are accepted.
// Development: Vite proxies relative "/api" calls to localhost:5000.
export const getApiBaseUrl = (): string => {
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (import.meta.env.PROD && raw) {
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }
  return '/api';
};

export const BASE_URL = getApiBaseUrl();

// Parse a JSON reply, turning HTML or plain-text error pages (a hosting 404,
// a sleeping server) into a readable message instead of a JSON syntax error.
export async function readJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? 'The server sent an unexpected reply. Please try again.'
        : `Can't reach the Ngala server right now (error ${res.status}). Please try again in a minute.`,
    );
  }
}
