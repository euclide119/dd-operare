/* Service worker: aplicația pornește și fără semnal (fișierele aplicației din cache); datele vin din rețea. */
const CACHE = 'dd-operare-20261105c';
const SHELL = ['./', './index.html', './styles.css?v=20261105a', './data.js?v=20261105c', './engine.js?v=20261105c', './prelucrare.js?v=20261019u', './contracte.js?v=20261019u', './acte.js?v=20261019u', './sync.js?v=20261105a', './views.js?v=20261105a', './app.js?v=20261105a', './dosare.js?v=20261023a', './plan_operare.js?v=20261105a', './operator.js?v=20261105c', './cititor.js?v=20261105a', './simplu.html', './simplu.css?v=20261105c', './simplu.js?v=20261105c', './manifest.webmanifest', './manifest-simplu.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('config.js')) return;
  e.respondWith(fetch(e.request, { cache: 'no-store' }).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
/* notificare de la server, chiar cu aplicația închisă */
self.addEventListener('push', (e) => { let m = {}; try { m = e.data.json(); } catch (x) { m = { titlu: 'DD Operare', corp: e.data ? e.data.text() : '' }; } e.waitUntil(self.registration.showNotification(m.titlu || 'DD Operare', { body: m.corp || '', tag: m.tag || undefined, icon: 'icon-192.png', badge: 'icon-192.png', vibrate: [300, 120, 300, 120, 300], requireInteraction: true })); });
self.addEventListener('notificationclick', (e) => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('./index.html')))); });
