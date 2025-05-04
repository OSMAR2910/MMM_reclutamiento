// service-worker.js

const CACHE_NAME = 'vacantes-app-v1';
const urlsToCache = [
  '/index.html',
  '/main.js',
  '/database.js',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalación del Service Worker y precarga en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache)
          .then(() => self.skipWaiting()); // Forzar activación inmediata
      })
      .catch(error => {
        console.error('Error al cachear:', error);
      })
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim()) // Tomar control inmediato
      .catch(error => console.error('Error al activar:', error))
  );
});

// Interceptar solicitudes: Usar red primero, caché como respaldo solo si está online
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si la petición es exitosa, actualizar el caché
        if (networkResponse && networkResponse.status === 200) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si no hay conexión, no usar caché como fallback
        return new Response('No hay conexión a internet', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Manejo de notificaciones
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, url } = event.data;
    const options = {
      body: body || 'Se ha registrado una nueva vacante.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: url || '/' }
    };
    self.registration.showNotification(title, options);
  }
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        const matchingClient = windowClients.find(client => 
          client.url === url && 'focus' in client
        );
        
        if (matchingClient) {
          return matchingClient.focus();
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch(error => console.error('Error al manejar clic:', error))
  );
});