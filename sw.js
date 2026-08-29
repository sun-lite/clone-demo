const CACHE = 'pmpml-sup7-v1';
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
  './items/profile.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))) .then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
