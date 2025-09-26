/**
 * Service Worker for Photo Roasting Web App
 * Handles caching, offline functionality, and PWA features
 * 
 * @fileoverview Service worker with intelligent caching strategies
 * @version 1.0.0
 */

const CACHE_NAME = 'photo-roast-v1.0.0';
const STATIC_CACHE = 'photo-roast-static-v1.0.0';
const DYNAMIC_CACHE = 'photo-roast-dynamic-v1.0.0';

// Files to cache immediately (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/src/styles/main.css',
  '/src/styles/components.css',
  '/manifest.json',
  '/favicon.ico'
];

// OpenAI API endpoints (for network-first caching)
const API_ENDPOINTS = [
  'https://api.openai.com/v1/chat/completions'
];

/**
 * Service Worker installation event
 * Pre-caches static assets for offline functionality
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Service Worker activation event
 * Cleans up old caches and takes control
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event handler with intelligent caching strategies
 * - Static assets: Cache First
 * - API calls: Network First with fallback
 * - Dynamic content: Network First
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiCall(request)) {
    event.respondWith(handleApiCall(request));
  } else {
    event.respondWith(handleDynamicContent(request));
  }
});

/**
 * Checks if request is for a static asset
 * @param {Request} request - The fetch request
 * @returns {boolean} True if static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$/);
}

/**
 * Checks if request is an API call
 * @param {Request} request - The fetch request
 * @returns {boolean} True if API call
 */
function isApiCall(request) {
  return API_ENDPOINTS.some(endpoint => request.url.startsWith(endpoint));
}

/**
 * Handles static asset requests with Cache First strategy
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response
 */
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

/**
 * Handles API calls with Network First strategy and intelligent caching
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response
 */
async function handleApiCall(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses for short time
      const cache = await caches.open(DYNAMIC_CACHE);
      const clonedResponse = networkResponse.clone();
      
      // Add timestamp for cache expiration
      const responseWithTimestamp = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: {
          ...clonedResponse.headers,
          'sw-cached-at': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] API call failed, checking cache:', error);
    
    // Try to serve from cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const age = Date.now() - parseInt(cachedAt || '0');
      
      // Serve cached response if less than 1 hour old
      if (age < 60 * 60 * 1000) {
        return cachedResponse;
      }
    }
    
    // Return offline fallback for API calls
    return new Response(JSON.stringify({
      error: 'Service temporarily unavailable',
      message: 'Please check your internet connection and try again.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handles dynamic content with Network First strategy
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response
 */
async function handleDynamicContent(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Dynamic content fetch failed:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/index.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    return new Response('Content not available offline', { status: 503 });
  }
}

/**
 * Handle background sync for failed requests
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Background sync implementation
 * @returns {Promise} Sync completion promise
 */
async function doBackgroundSync() {
  // Implementation for retrying failed requests
  console.log('[SW] Performing background sync...');
  // This would typically retry failed API calls stored in IndexedDB
}

/**
 * Handle push notifications (future feature)
 */
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push notification received:', data);
    
    const options = {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.data);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
