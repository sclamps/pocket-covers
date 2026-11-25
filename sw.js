// Pocket Covers service worker: keeps the app and the sample working offline.
// Bump VERSION whenever you deploy changes so devices pick up the new files.
const VERSION = "pc-v3";
const CORE = [
  "./",
  "index.html",
  "stretch.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "favicon.png",
  "thumb.jpg",
  "audio.mp3",
  "video.mp4"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

// Safari asks for video in byte ranges, so serve slices of the cached file when offline.
async function rangeFromCache(request) {
  const cached = await caches.match(request.url);
  if (!cached) return fetch(request);
  const blob = await cached.blob();
  const match = /bytes=(\d*)-(\d*)/.exec(request.headers.get("range") || "");
  const start = match && match[1] ? Number(match[1]) : 0;
  const end = match && match[2] ? Number(match[2]) : blob.size - 1;
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "video/mp4",
      "Content-Range": `bytes ${start}-${end}/${blob.size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes"
    }
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // The page itself: try the network first so updates show up, fall back to the cached copy offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(VERSION).then(cache => cache.put("index.html", copy));
          return response;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  if (request.headers.get("range") && url.origin === location.origin) {
    event.respondWith(fetch(request).catch(() => rangeFromCache(request)));
    return;
  }

  // Google Fonts and our own files: cache first, refresh in the background.
  if (url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    event.respondWith(
      caches.match(request).then(cached => {
        const network = fetch(request)
          .then(response => {
            if (response.ok || response.type === "opaque") {
              const copy = response.clone();
              caches.open(VERSION).then(cache => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
