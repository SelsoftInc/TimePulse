/**
 * API Client with automatic fallback to static data
 * Automatically detects server connection and uses mock data when offline
 */

import { apiRequest, isStaticMode } from '@/services/staticApiService';
import { API_BASE } from '@/config/api';

/**
 * Check if server is reachable
 */
async function checkServerConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('⚠️ Server not reachable, using static mode');
    return false;
  }
}

/**
 * Smart API client that automatically falls back to static data
 */
export const apiClient = {
  /**
   * GET request with automatic fallback
   */
  async get(endpoint, params = {}) {
    // If already in static mode, use static data immediately
    if (isStaticMode()) {
      console.log(`📦 Static Mode: GET ${endpoint}`);
      return apiRequest('GET', endpoint, params);
    }
    
    // Try real API first
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const url = new URL(`${API_BASE}${endpoint}`);
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`🌐 Real API: GET ${endpoint}`);
      return data;
      
    } catch (error) {
      console.log(`⚠️ API Error, falling back to static data: ${error.message}`);
      // Fallback to static data
      return apiRequest('GET', endpoint, params);
    }
  },

  /**
   * POST request with automatic fallback
   */
  async post(endpoint, data = {}) {
    // If already in static mode, use static data immediately
    if (isStaticMode()) {
      console.log(`📦 Static Mode: POST ${endpoint}`);
      return apiRequest('POST', endpoint, data);
    }
    
    // Try real API first
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`🌐 Real API: POST ${endpoint}`);
      return result;
      
    } catch (error) {
      console.log(`⚠️ API Error, falling back to static data: ${error.message}`);
      // Fallback to static data
      return apiRequest('POST', endpoint, data);
    }
  },

  /**
   * PUT request with automatic fallback
   */
  async put(endpoint, data = {}) {
    // If already in static mode, use static data immediately
    if (isStaticMode()) {
      console.log(`📦 Static Mode: PUT ${endpoint}`);
      return apiRequest('PUT', endpoint, data);
    }
    
    // Try real API first
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`🌐 Real API: PUT ${endpoint}`);
      return result;
      
    } catch (error) {
      console.log(`⚠️ API Error, falling back to static data: ${error.message}`);
      // Fallback to static data
      return apiRequest('PUT', endpoint, data);
    }
  },

  /**
   * DELETE request with automatic fallback
   */
  async delete(endpoint) {
    // If already in static mode, use static data immediately
    if (isStaticMode()) {
      console.log(`📦 Static Mode: DELETE ${endpoint}`);
      return apiRequest('DELETE', endpoint);
    }
    
    // Try real API first
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`🌐 Real API: DELETE ${endpoint}`);
      return result;
      
    } catch (error) {
      console.log(`⚠️ API Error, falling back to static data: ${error.message}`);
      // Fallback to static data
      return apiRequest('DELETE', endpoint);
    }
  }
};

// Export default
export default apiClient;
