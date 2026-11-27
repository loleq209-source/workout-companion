const CACHE_NAME = "workout-companion-v10.7";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./data/exercises_enriched_34.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Ignore cross-origin API calls or Apps Script requests from SW caching
  if (url.origin !== self.location.origin) {
    return;
  }

  // Stale-while-revalidate for static illustrations & assets (instant load + background freshness)
  if (url.pathname.includes("/assets/") || url.pathname.includes("/data/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".webp")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request).then((resp) => {
          if (resp && resp.status === 200) {
            const toCache = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, toCache));
          }
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first with offline cache fallback for app shell / HTML
  e.respondWith(
    fetch(e.request)
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const toCache = networkResp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, toCache));
        }
        return networkResp;
      })
      .catch(() => {
        return caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return Response.error();
        });
      })
  );
});
