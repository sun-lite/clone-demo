const CACHE = 'pmpml-sup7-v3';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './items/logo.png',
    './items/bus_ticket.png',
    './items/daily_pass.png',
    './items/ticket_icon.png',
    './items/bus_stop.png',
    './items/google_map.jpeg',
    './items/route_timetable.png',
    './items/pune_metro.png',
    './items/profile.png',
    './items/qr_code.png'
];

// Shell resources must never be served stale: a cached index.html keeps the old
// "requestFullscreen" code and the old yellow theme colour alive on the installed PWA.
const SHELL_MANIFEST = './manifest.json';

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

function shellKeyFor(url) {
    if (url.origin !== self.location.origin) return null;
    const path = url.pathname.replace(/\/+$/, '/');
    if (path.endsWith('/manifest.json')) return SHELL_MANIFEST;
    if (path.endsWith('/index.html') || path === '/') return './index.html';
    return null;
}

self.addEventListener('fetch', e => {
    const request = e.request;
    if (request.method !== 'GET') return;

    let url;
    try {
        url = new URL(request.url);
    } catch (err) {
        return;
    }

    // Network first for the shell (HTML + manifest): always pick up manifest/theme changes.
    const shellKey = request.mode === 'navigate' ? './index.html' : shellKeyFor(url);
    if (shellKey) {
        e.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then(c => {
                            // Keep every shell alias in sync so no stale copy survives.
                            const puts = [c.put(request, copy.clone())];
                            if (shellKey === './index.html') {
                                puts.push(c.put('./index.html', copy.clone()));
                                puts.push(c.put('./', copy.clone()));
                            } else {
                                puts.push(c.put(SHELL_MANIFEST, copy.clone()));
                            }
                            puts.forEach(p => p.catch(() => {}));
                        }).catch(() => {});
                    }
                    return response;
                })
                .catch(() => caches.match(request).then(cached => cached || caches.match(shellKey)))
        );
        return;
    }

    // Cache first for static assets, refreshed in the background.
    e.respondWith(
        caches.match(request).then(cached => {
            const network = fetch(request)
                .then(response => {
                    if (response && response.ok && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
