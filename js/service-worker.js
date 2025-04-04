importScripts("/js/firebase.js");

const CACHE_NAME = "juego-cache-v2";

const urlsToCache = [
  "/",
  "/index.html",
  "/css/normalize.css",
  "/css/style.css",
  "/js/firebase.js",
  "/js/database.js",
  "/js/main.js",
  "/js/singlePlayer.js",
  "/json/P&R.json",
  "/json/P&R_single.json",
  "/json/avatars.json",
  "/manifest.json",
  "/img/Logos/interfaces/icons/logo.jpg",
  "/img/avatars/default.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cacheando recursos esenciales");
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("Error al cachear:", error);
      });
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(`Sirviendo desde caché: ${event.request.url}`);
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        console.log(`Modo offline, intentando fallback para: ${event.request.url}`);
        return caches.match("/index.html").then((fallback) => {
          if (fallback) {
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) =>
                client.postMessage({
                  type: "OFFLINE",
                  message: "Estás offline. Funcionalidad limitada.",
                })
              );
            });
            return fallback;
          }
          return new Response(
            "<h1>Modo Offline</h1><p>Estás sin conexión. Por favor, recarga cuando tengas internet.</p>",
            {
              headers: { "Content-Type": "text/html" },
              status: 503,
            }
          );
        });
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );

  const showHourlyNotification = async () => {
    const userData = await getUserData();
    const name = userData?.name || "Jugador";
    const message = `¡Hola ${name}! Han pasado 60 minutos, ¿listo para jugar otra vez?`;

    self.registration.showNotification("¿Qué digo?", {
      body: message,
      icon: "/img/Logos/interfaces/icons/logo.jpg",
      badge: "/img/Logos/interfaces/icons/logo.jpg",
    });

    setTimeout(showHourlyNotification, 60 * 60 * 1000); // 1 hora
  };

  showHourlyNotification();
});

const getUserData = async () => {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    const message = await new Promise((resolve) => {
      client.postMessage({ type: "GET_USER_DATA" });
      self.addEventListener("message", (event) => {
        if (event.data.type === "USER_DATA_RESPONSE") resolve(event.data);
      }, { once: true });
    });
    if (message) return message;
  }
  return { name: "Jugador" };
};

self.addEventListener("message", (event) => {
  if (event.data.type === "GET_USER_DATA") {
    event.source.postMessage({
      type: "USER_DATA_RESPONSE",
      uid: event.data.uid || null,
      name: event.data.name || "Jugador",
      points: event.data.points || {},
    });
  }
});