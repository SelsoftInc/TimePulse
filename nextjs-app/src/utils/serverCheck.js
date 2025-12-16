/**
 * Server Connection Check Utility
 * Checks if the backend server is available
 */

import { API_BASE } from '@/config/api';

/**
 * Check if server is reachable
 * @returns {Promise<boolean>} true if server is connected, false otherwise
 */
export async function isServerConnected() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    // Try to ping a simple health endpoint or any API endpoint
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('⚠️ Server not reachable:', error.message);
    return false;
  }
}

/**
 * Check server connection and cache result for a short time
 * to avoid multiple checks in quick succession
 */
let lastCheckTime = 0;
let lastCheckResult = false;
const CACHE_DURATION = 5000; // 5 seconds

export async function isServerConnectedCached() {
  const now = Date.now();
  
  // Return cached result if recent
  if (now - lastCheckTime < CACHE_DURATION) {
    return lastCheckResult;
  }
  
  // Perform new check
  lastCheckResult = await isServerConnected();
  lastCheckTime = now;
  
  return lastCheckResult;
}
