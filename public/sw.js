// TRIPPIN Service Worker for PWA functionality
const CACHE_NAME = 'trippin-v1.0.0';
const STATIC_CACHE = 'trippin-static-v1';
const DYNAMIC_CACHE = 'trippin-dynamic-v1';
const API_CACHE = 'trippin-api-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './trippin-logo.png',
  './src/main.tsx',
  './src/index.css'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/google-places',
  '/tripadvisor',
  '/currency-convert'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
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

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip non-GET requests for API endpoints to allow POST/PUT/DELETE
  if (request.method !== 'GET' && url.pathname.startsWith('/api')) {
    return;
  }
  
  // Skip other non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Bypass service worker for media and range requests to avoid 206 partial caching issues
  if (url.pathname.match(/\.(mp4|webm|mp3|wav|m4a|ogg)$/i) || request.headers.get('range')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(handleDynamicContent(request));
  }
});

// Check if request is for static assets
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Check if request is for API
function isAPIRequest(url) {
  return url.pathname.startsWith('/api') ||
         url.hostname.includes('execute-api') || 
         CACHEABLE_APIS.some(api => url.pathname.includes(api));
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving static asset from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Fetching static asset from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Avoid caching partial or media responses
    const contentType = networkResponse.headers.get('content-type') || '';
    const isPartial = networkResponse.status === 206;
    const isMedia = /^(video|audio)\//i.test(contentType);
    if (networkResponse.ok && !isPartial && !isMedia) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    console.log('[SW] Fetching API from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests for certain APIs
    if (networkResponse.ok && request.method === 'GET' && isCacheableAPI(request.url)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for API:', request.url);
    
    if (request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('[SW] Serving API from cache:', request.url);
        return cachedResponse;
      }
    }
    
    // Return offline response for API failures
    return new Response(JSON.stringify({
      success: false,
      error: 'Service temporarily unavailable',
      offline: true,
      message: 'この機能は現在オフラインです。インターネット接続を確認してください。'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Handle navigation with app shell pattern
async function handleNavigation(request) {
  try {
    console.log('[SW] Handling navigation:', request.url);
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, serving app shell');
    
    const cache = await caches.open(STATIC_CACHE);
    const appShell = await cache.match('/index.html');
    
    if (appShell) {
      return appShell;
    }
    
    return new Response('App not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle dynamic content with network-first strategy
async function handleDynamicContent(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses except partial or media
    const contentType = networkResponse.headers.get('content-type') || '';
    const isPartial = networkResponse.status === 206;
    const isMedia = /^(video|audio)\//i.test(contentType);
    if (networkResponse.ok && !isPartial && !isMedia) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for dynamic content, trying cache');
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content not available offline', { status: 503 });
  }
}

// Check if API endpoint should be cached
function isCacheableAPI(url) {
  return CACHEABLE_APIS.some(api => url.includes(api));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options);
        await removeOfflineAction(action.id);
        console.log('[SW] Synced offline action:', action.id);
      } catch (error) {
        console.error('[SW] Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Get offline actions from IndexedDB
async function getOfflineActions() {
  // Implementation would use IndexedDB to store offline actions
  return [];
}

// Remove synced offline action
async function removeOfflineAction(actionId) {
  // Implementation would remove from IndexedDB
  console.log('[SW] Removed offline action:', actionId);
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'TRIPPINからの通知',
    icon: '/trippin-logo.png',
    badge: '/trippin-logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '詳細を見る',
        icon: '/trippin-logo.png'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TRIPPIN', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service worker script loaded');