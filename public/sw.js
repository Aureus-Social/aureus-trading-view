const CACHE_NAME = 'aureus-tv-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json']

// Install — cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('polygon.io') || e.request.url.includes('supabase')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/')))
  )
})

// Push notifications — alertes prix
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || '🔔 Aureus TV', {
      body: data.body || 'Alerte prix déclenchée',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'aureus-alert',
      data: { url: data.url || '/' },
      actions: [
        { action: 'view', title: 'Voir le chart' },
        { action: 'dismiss', title: 'Ignorer' }
      ]
    })
  )
})

// Notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  if (e.action === 'dismiss') return
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(ws => {
      const url = e.notification.data?.url || '/'
      if (ws.length > 0) { ws[0].focus(); ws[0].navigate(url) }
      else clients.openWindow(url)
    })
  )
})
