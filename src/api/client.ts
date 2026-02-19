import axios from 'axios';

// Allow overriding API base at runtime (useful when preview can't reach localhost)
function getRuntimeBase() {
  try {
    if (typeof window !== 'undefined') {
      const fromStorage = window.localStorage.getItem('apiBase');
      if (fromStorage) return fromStorage;
    }
  } catch (e) {
    // ignore
  }
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
}

export const api = axios.create({
  baseURL: getRuntimeBase(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/markdown, application/json;q=0.9, text/plain;q=0.8'
  }
});

// Helper to change API base at runtime (updates axios instance and stores setting)
export function setApiBase(url: string) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('apiBase', url);
    }
  } catch (e) {
    // ignore
  }
  api.defaults.baseURL = url;
}
