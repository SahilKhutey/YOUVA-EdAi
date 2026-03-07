// Youva EdAi Service Worker
// Strategy: Cache-first for static assets, network-first for API calls

const CACHE_NAME = 'youva-edai-v1';
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/manifest.json',
];

// ── Install: cache static shell ───────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch strategy ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET, chrome-extension, and API calls (always network-first)
    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io')) return;

    // Next.js hot reload / dev server — skip
    if (url.pathname.startsWith('/_next/webpack-hmr')) return;

    event.respondWith(
        caches.match(request).then((cached) => {
            // Return cached version immediately, then revalidate in background
            const fetchPromise = fetch(request)
                .then((networkRes) => {
                    if (networkRes && networkRes.status === 200) {
                        const cloned = networkRes.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
                    }
                    return networkRes;
                })
                .catch(() => cached); // Offline fallback

            return cached || fetchPromise;
        })
    );
});
