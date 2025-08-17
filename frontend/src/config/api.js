// Centralized API configuration
// Reads base URL from REACT_APP_API_BASE, falls back to localhost:5001

export const API_BASE = (() => {
  const envBase = process.env.REACT_APP_API_BASE;
  if (envBase) return envBase;
  const fallback = 'http://localhost:5001';
  // Surface a helpful hint in dev
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[api] REACT_APP_API_BASE not set; using fallback:', fallback);
  }
  return fallback;
})();

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
