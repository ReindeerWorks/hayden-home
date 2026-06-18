/* Hayden's Home — minimal service worker.
   Caches the landing-page shell so it opens offline. Bump CACHE on changes. */
const CACHE = "hayden-home-v1";

// Same-origin shell assets the launcher needs to render.
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./favicon-32.png",
  "./favicon-16.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./images/math-quest.png",
  "./images/memory-match.png",
  "./images/gabby-memory.png",
  "./images/spell-the-summon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Leave cross-origin requests (game links, Google Photos) to the network.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to the cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Other same-origin assets: cache-first, then network (and cache it).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
