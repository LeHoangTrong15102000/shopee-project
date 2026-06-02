# 📱 PROGRESSIVE WEB APPS (PWA) - ỨNG DỤNG WEB TIẾN BỘ

> **Tài liệu chi tiết về Progressive Web Apps cho dự án Shopee Clone**
>
> **Tác giả:** AI Assistant | **Ngày:** 20/03/2026 | **Version:** 1.0

---

## 📑 MỤC LỤC

1. [Giới thiệu về PWA](#1-giới-thiệu-về-pwa)
2. [Service Workers](#2-service-workers)
3. [Offline Support](#3-offline-support)
4. [Caching Strategies](#4-caching-strategies)
5. [Push Notifications](#5-push-notifications)
6. [App Manifest](#6-app-manifest)
7. [Install Prompt](#7-install-prompt)
8. [Background Sync](#8-background-sync)
9. [Performance Optimization](#9-performance-optimization)
10. [Best Practices](#10-best-practices)

---

## 1. GIỚI THIỆU VỀ PWA

### 1.1. PWA là gì?

**Progressive Web App (PWA)** là web applications sử dụng modern web capabilities để deliver app-like experience.

### 1.2. Đặc điểm của PWA

**Core Features:**

- **Progressive**: Work cho mọi users, bất kể browser
- **Responsive**: Fit mọi form factor (desktop, mobile, tablet)
- **Connectivity independent**: Work offline hoặc slow network
- **App-like**: Feel like native app
- **Fresh**: Always up-to-date (service worker)
- **Safe**: Served via HTTPS
- **Discoverable**: Identifiable as "application" (manifest)
- **Re-engageable**: Push notifications
- **Installable**: Add to home screen
- **Linkable**: Share via URL

### 1.3. Benefits

**For Users:**

- ✅ Fast loading
- ✅ Work offline
- ✅ Install to home screen
- ✅ Push notifications
- ✅ No app store required

**For Developers:**

- ✅ Single codebase (web + mobile)
- ✅ No app store approval
- ✅ Instant updates
- ✅ Lower development cost
- ✅ Better SEO

### 1.4. PWA vs Native App

| Feature                | PWA                | Native App        |
| ---------------------- | ------------------ | ----------------- |
| **Installation**       | Add to home screen | App store         |
| **Updates**            | Automatic          | Manual            |
| **Distribution**       | URL                | App store         |
| **Development**        | Web technologies   | Platform-specific |
| **Offline**            | ✅ Yes             | ✅ Yes            |
| **Push Notifications** | ✅ Yes             | ✅ Yes            |
| **Hardware Access**    | ⚠️ Limited         | ✅ Full           |
| **Performance**        | ⚠️ Good            | ✅ Excellent      |

---

## 2. SERVICE WORKERS

### 2.1. Khái niệm

**Service Worker** là JavaScript file chạy separately từ main browser thread, act như proxy giữa web app và network.

```
Browser → Service Worker → Network
            ↓
          Cache
```

### 2.2. Service Worker Lifecycle

```
Install → Activate → Fetch/Message → Terminate
```

### 2.3. Register Service Worker

```typescript
// src/main.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration)
      })
      .catch((error) => {
        console.error('SW registration failed:', error)
      })
  })
}
```

### 2.4. Service Worker Implementation

```typescript
// public/sw.js
const CACHE_NAME = 'shopee-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/logo.png',
]

// Install event: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache')
      return cache.addAll(urlsToCache)
    }),
  )
})

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Fetch event: Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      // Clone request
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})
```

### 2.5. Update Service Worker

```typescript
// src/utils/serviceWorker.ts
export const updateServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update()
      }
    })
  }
}

// Check for updates every hour
setInterval(
  () => {
    updateServiceWorker()
  },
  60 * 60 * 1000,
)
```

### 2.6. Skip Waiting

```typescript
// public/sw.js
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

self.addEventListener('activate', (event) => {
  // Claim clients immediately
  event.waitUntil(self.clients.claim())
})
```

---

## 3. OFFLINE SUPPORT

### 3.1. Offline Page

```typescript
// public/sw.js
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(OFFLINE_URL)
    }),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      }),
    )
  }
})
```

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>Offline - Shopee Clone</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 50px;
      }
      h1 {
        color: #ee4d2d;
      }
    </style>
  </head>
  <body>
    <h1>Bạn đang offline</h1>
    <p>Vui lòng kiểm tra kết nối internet của bạn.</p>
    <button onclick="window.location.reload()">Thử lại</button>
  </body>
</html>
```

### 3.2. Offline Indicator

```typescript
// src/components/OfflineIndicator.tsx
import { useState, useEffect } from 'react'

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f44336',
        color: 'white',
        padding: '10px',
        textAlign: 'center',
        zIndex: 9999
      }}
    >
      Bạn đang offline. Một số tính năng có thể không hoạt động.
    </div>
  )
}

export default OfflineIndicator
```

### 3.3. Offline Data Storage

```typescript
// src/utils/offlineStorage.ts
import { openDB, DBSchema } from 'idb'

interface ShopeeDB extends DBSchema {
  products: {
    key: string
    value: Product
  }
  cart: {
    key: string
    value: CartItem
  }
}

const dbPromise = openDB<ShopeeDB>('shopee-db', 1, {
  upgrade(db) {
    db.createObjectStore('products', { keyPath: 'id' })
    db.createObjectStore('cart', { keyPath: 'id' })
  },
})

// Save product to IndexedDB
export const saveProduct = async (product: Product) => {
  const db = await dbPromise
  await db.put('products', product)
}

// Get product from IndexedDB
export const getProduct = async (id: string): Promise<Product | undefined> => {
  const db = await dbPromise
  return db.get('products', id)
}

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  const db = await dbPromise
  return db.getAll('products')
}
```

---

## 4. CACHING STRATEGIES

### 4.1. Cache First (Cache Falling Back to Network)

**Best for:** Static assets (CSS, JS, images)

```typescript
// public/sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})
```

### 4.2. Network First (Network Falling Back to Cache)

**Best for:** Dynamic content (API calls)

```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
      }),
  )
})
```

### 4.3. Stale While Revalidate

**Best for:** Frequently updated content

```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Update cache
          cache.put(event.request, networkResponse.clone())
          return networkResponse
        })

        // Return cached response immediately, update in background
        return cachedResponse || fetchPromise
      })
    }),
  )
})
```

### 4.4. Cache Only

**Best for:** App shell

```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request))
})
```

### 4.5. Network Only

**Best for:** Analytics, non-GET requests

```typescript
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
```

### 4.6. Strategy Selection

```typescript
// public/sw.js
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API calls: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
  }
  // Static assets: Cache First
  else if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(cacheFirst(request))
  }
  // HTML: Stale While Revalidate
  else if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request))
  }
  // Default: Network First
  else {
    event.respondWith(networkFirst(request))
  }
})

const cacheFirst = async (request) => {
  const cached = await caches.match(request)
  return cached || fetch(request)
}

const networkFirst = async (request) => {
  try {
    const response = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    return caches.match(request)
  }
}

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone())
    return response
  })

  return cached || fetchPromise
}
```

---

## 5. PUSH NOTIFICATIONS

### 5.1. Request Permission

```typescript
// src/utils/notifications.ts
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}
```

### 5.2. Subscribe to Push

```typescript
// src/utils/push.ts
export const subscribeToPush = async () => {
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  // Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })

  return subscription
}

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
```

### 5.3. Handle Push Events

```typescript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: data.url,
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url))
})
```

### 5.4. Backend (Send Push)

```typescript
// Backend: Send push notification
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:contact@shopee.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

export const sendPushNotification = async (
  subscription: PushSubscription,
  payload: {
    title: string
    body: string
    url: string
  },
) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
  } catch (error) {
    console.error('Error sending push notification:', error)
  }
}

// Usage: Send notification when order status changes
const notifyOrderStatus = async (userId: string, orderId: string) => {
  const subscriptions = await getUserPushSubscriptions(userId)

  const payload = {
    title: 'Đơn hàng đã được giao',
    body: `Đơn hàng #${orderId} đã được giao thành công`,
    url: `/orders/${orderId}`,
  }

  await Promise.all(subscriptions.map((sub) => sendPushNotification(sub, payload)))
}
```

---

## 6. APP MANIFEST

### 6.1. Web App Manifest

```json
// public/manifest.json
{
  "name": "Shopee Clone",
  "short_name": "Shopee",
  "description": "E-commerce platform for buying and selling products",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ee4d2d",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["shopping", "lifestyle"],
  "shortcuts": [
    {
      "name": "Giỏ hàng",
      "short_name": "Cart",
      "description": "Xem giỏ hàng của bạn",
      "url": "/cart",
      "icons": [{ "src": "/cart-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "Đơn hàng",
      "short_name": "Orders",
      "description": "Xem đơn hàng của bạn",
      "url": "/orders",
      "icons": [{ "src": "/orders-icon.png", "sizes": "96x96" }]
    }
  ]
}
```

### 6.2. Link Manifest

```html
<!-- index.html -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#ee4d2d" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Shopee" />
<link rel="apple-touch-icon" href="/icon-192x192.png" />
```

---

## 7. INSTALL PROMPT

### 7.1. Capture Install Event

```typescript
// src/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react'

export const useInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default install prompt
      e.preventDefault()
      // Save event for later
      setInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!installPrompt) return false

    // Show install prompt
    installPrompt.prompt()

    // Wait for user choice
    const { outcome } = await installPrompt.userChoice

    // Clear prompt
    setInstallPrompt(null)

    return outcome === 'accepted'
  }

  return { installPrompt, isInstalled, promptInstall }
}
```

### 7.2. Install Button Component

```typescript
// src/components/InstallButton.tsx
import { useInstallPrompt } from 'src/hooks/useInstallPrompt'

const InstallButton = () => {
  const { installPrompt, isInstalled, promptInstall } = useInstallPrompt()

  if (isInstalled || !installPrompt) return null

  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      console.log('User accepted install')
    } else {
      console.log('User dismissed install')
    }
  }

  return (
    <button
      onClick={handleInstall}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: '#ee4d2d',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        zIndex: 1000
      }}
    >
      Cài đặt ứng dụng
    </button>
  )
}

export default InstallButton
```

---

## 8. BACKGROUND SYNC

### 8.1. Register Background Sync

```typescript
// src/utils/backgroundSync.ts
export const registerBackgroundSync = async (tag: string) => {
  const registration = await navigator.serviceWorker.ready

  try {
    await registration.sync.register(tag)
    console.log('Background sync registered:', tag)
  } catch (error) {
    console.error('Background sync registration failed:', error)
  }
}

// Usage: Sync cart when back online
export const syncCart = async (cartItems: CartItem[]) => {
  // Save to IndexedDB
  await saveCartToIndexedDB(cartItems)

  // Register background sync
  await registerBackgroundSync('sync-cart')
}
```

### 8.2. Handle Sync Event

```typescript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartToServer())
  }
})

const syncCartToServer = async () => {
  try {
    // Get cart from IndexedDB
    const cart = await getCartFromIndexedDB()

    // Sync to server
    const response = await fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cart),
    })

    if (response.ok) {
      // Clear IndexedDB after successful sync
      await clearCartFromIndexedDB()
    }
  } catch (error) {
    console.error('Cart sync failed:', error)
    throw error // Retry later
  }
}
```

---

## 9. PERFORMANCE OPTIMIZATION

### 9.1. Lazy Loading

```typescript
// Lazy load images
<img
  src="placeholder.jpg"
  data-src="product.jpg"
  loading="lazy"
  alt="Product"
/>
```

### 9.2. Precaching

```typescript
// public/sw.js
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/icon-192x192.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }),
  )
})
```

### 9.3. Runtime Caching

```typescript
// Cache API responses at runtime
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open('api-cache').then((cache) => {
        return fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone())
            return response
          })
          .catch(() => cache.match(event.request))
      }),
    )
  }
})
```

---

## 10. BEST PRACTICES

### 10.1. PWA Checklist

**Core:**

- [ ] HTTPS enabled
- [ ] Service worker registered
- [ ] Web app manifest
- [ ] Responsive design
- [ ] Fast loading (< 3s)

**Offline:**

- [ ] Offline page
- [ ] Offline indicator
- [ ] Cache static assets
- [ ] Cache API responses
- [ ] Background sync

**Installability:**

- [ ] Manifest với icons
- [ ] Install prompt
- [ ] Standalone display mode
- [ ] Theme color

**Engagement:**

- [ ] Push notifications
- [ ] App shortcuts
- [ ] Share target

**Performance:**

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1

### 10.2. Testing

```bash
# Lighthouse audit
npx lighthouse https://shopee.com --view

# PWA audit
npx pwa-asset-generator logo.svg ./public/icons
```

### 10.3. Debugging

```typescript
// Check service worker status
navigator.serviceWorker.getRegistration().then((registration) => {
  console.log('SW state:', registration?.active?.state)
})

// Check cache
caches.keys().then((keys) => {
  console.log('Cache keys:', keys)
})

// Check push subscription
navigator.serviceWorker.ready.then((registration) => {
  registration.pushManager.getSubscription().then((subscription) => {
    console.log('Push subscription:', subscription)
  })
})
```

---

**Kết luận:**

PWA là future của web development, combining best của web và native apps:

**Khi nào nên build PWA:**

- E-commerce sites
- News/media sites
- Social networks
- Productivity apps
- Content platforms

**Benefits:**

- Better user experience
- Increased engagement
- Lower development cost
- Better SEO
- Cross-platform

**Tài liệu tham khảo:**

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Workbox](https://developers.google.com/web/tools/workbox)
