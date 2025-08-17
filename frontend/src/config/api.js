// Centralized API configuration
// Reads base URL from REACT_APP_API_BASE, falls back to localhost:5002

export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5002';

/**
 * apiFetch: wrapper around fetch that prefixes API_BASE and sets JSON headers.
 * @param {string} path - path starting with /api
 * @param {RequestInit} options - fetch options
 * @param {Object} config - extra config like timeoutMs
 */
export async function apiFetch(path, options = {}, config = {}) {
  const { timeoutMs = 15000 } = config;
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
