// Service worker : garde l'appli en cache pour un démarrage rapide.
// Les données Firestore ne passent pas par ici (Firebase gère son propre cache).
const CACHE = "budget-foyer-v1";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const cacheable = url =>
  url.origin === self.location.origin ||
  url.href.startsWith("https://www.gstatic.com/firebasejs/") ||
  url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

// Réponse immédiate depuis le cache, mise à jour en arrière-plan.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (!cacheable(url)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request);
    const network = fetch(e.request).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
