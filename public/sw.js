const CACHE_NAME = 'instantown-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/offerte.html',
  '/servizi.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Non intercettare richieste verso domini esterni (Google Sheets, API, ecc.)
  // - lasciale passare direttamente alla rete, senza cache.
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) {
    return; // lascia che il browser gestisca la richiesta normalmente
  }

  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request))
      .then(response => {
        // Se né la rete né la cache hanno una risposta valida,
        // restituisci una risposta di fallback invece di undefined
        // (evita l'errore "Failed to convert value to 'Response'"
        // e il conseguente loop infinito).
        if (response) return response;
        return new Response('Risorsa non disponibile offline.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});
