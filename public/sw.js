/* SportixTV service worker.
 *
 * Rules:
 * - Live streams (/api/*, .m3u8, .ts media) are NEVER intercepted or cached.
 * - Navigations: network-first, offline fallback page when unreachable.
 * - Images & static assets: cache-first with a bounded cache.
 */
const VERSION = "v1";
const OFFLINE_CACHE = `stv-offline-${VERSION}`;
const ASSET_CACHE = `stv-assets-${VERSION}`;
const OFFLINE_URL = "/offline";
const MAX_ASSETS = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![OFFLINE_CACHE, ASSET_CACHE].includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, max);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never touch streams or APIs.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.endsWith(".m3u8") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".m4s")
  ) {
    return;
  }

  // Page navigations: network first, offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .open(OFFLINE_CACHE)
          .then((cache) => cache.match(OFFLINE_URL))
          .then((res) => res || Response.error()),
      ),
    );
    return;
  }

  // Same-origin static assets + any images: cache first.
  const isStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/"));
  const isImage = request.destination === "image";
  if (isStatic || isImage) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok && (res.type === "basic" || res.type === "cors")) {
          cache.put(request, res.clone());
          trimCache(ASSET_CACHE, MAX_ASSETS);
        }
        return res;
      }),
    );
  }
});
