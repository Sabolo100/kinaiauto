/* kinaiauto.com — service worker
   Strategy:
   - navigations: network-first (4 s timeout) → cache → /offline
   - /_next/static/*: cache-first (content-hashed, immutable)
   - images (any origin): stale-while-revalidate, capped
   - everything else same-origin GET: network, fallback cache
   CMS (/c4m5s6, /api) is never cached.
*/
const VERSION = "ka-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const IMG_CACHE = `${VERSION}-img`;
const OFFLINE_URL = "/offline";
const IMG_MAX = 160;
const PAGE_MAX = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll([OFFLINE_URL, "/icons/icon-192.png"])).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch {}
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Never touch CMS, APIs, dev tooling
  if (sameOrigin && (url.pathname.startsWith("/c4m5s6") || url.pathname.startsWith("/api") || url.pathname.startsWith("/_next/webpack-hmr"))) return;
  if (url.pathname === "/sw.js") return;

  // 1. Navigations → network-first
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preload = event.preloadResponse ? await event.preloadResponse : null;
          const res = preload || (await Promise.race([fetch(req), timeout(4000)]));
          if (res && res.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(req, res.clone());
            trim(PAGE_CACHE, PAGE_MAX);
          }
          return res;
        } catch {
          const cached = await caches.match(req, { ignoreSearch: true });
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return offline || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  // 2. Next static assets → cache-first
  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // 3. Images → stale-while-revalidate
  if (req.destination === "image" || /\.(png|jpe?g|webp|avif|gif|svg|ico)(\?|$)/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === "opaque")) {
              cache.put(req, res.clone());
              trim(IMG_CACHE, IMG_MAX);
            }
            return res;
          })
          .catch(() => hit);
        return hit || network;
      }),
    );
    return;
  }

  // 4. Other same-origin GET (fonts, manifest, data) → network, fallback cache
  if (sameOrigin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req)),
    );
  }
});
