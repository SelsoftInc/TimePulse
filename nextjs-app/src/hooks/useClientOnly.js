/**
 * Custom hook to ensure code only runs on client-side
 * Prevents hydration mismatches in Next.js
 */

import { useState, useEffect } from 'react';

export function useClientOnly() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

/**
 * Custom hook for safe localStorage access
 * Returns [value, setValue, isLoaded]
 */
export function useLocalStorage(key, initialValue = null) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoaded];
}

/**
 * Get auth token safely
 */
export function useAuthToken() {
  const [token, setToken, isLoaded] = useLocalStorage('token', null);
  return { token, setToken, isLoaded };
}

/**
 * Get user info safely
 */
export function useUserInfo() {
  const [user, setUser, isLoaded] = useLocalStorage('user', null);
  return { user, setUser, isLoaded };
}
