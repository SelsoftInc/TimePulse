// Performance optimization utilities

/**
 * Debounce function to limit API calls
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Simple in-memory cache with expiration
 */
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 60000) { // Default 1 minute TTL
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export const apiCache = new SimpleCache();

/**
 * Cached fetch wrapper
 */
export async function cachedFetch(url, options = {}, ttl = 60000) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('📦 Cache hit:', url);
    return cached;
  }
  
  // Fetch and cache
  console.log('🌐 Fetching:', url);
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (response.ok) {
    apiCache.set(cacheKey, data, ttl);
  }
  
  return data;
}

/**
 * Preload critical resources
 */
export function preloadResource(href, as = 'script') {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Lazy load images
 */
export function lazyLoadImage(img) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = image.dataset.src;
          observer.unobserve(image);
        }
      });
    });
    observer.observe(img);
  } else {
    img.src = img.dataset.src;
  }
}

/**
 * Check if component should update (shallow comparison)
 */
export function shallowEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Measure component render time
 */
export function measureRender(componentName, callback) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    console.log(`⏱️ ${componentName} rendered in ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return callback();
}
