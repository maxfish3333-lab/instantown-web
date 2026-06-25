#!/usr/bin/env node
// fix-service-worker-loop.js
// Corregge il bug critico in sw.js che causa un loop infinito di errori:
// "Failed to convert value to 'Response'". Il problema: quando una
// richiesta fallisce e non è in cache, caches.match() restituisce
// undefined, e respondWith(undefined) genera l'errore che si ripete
// indefinitamente per ogni richiesta non cachata (es. verso Google
// Sheets, chiamato ripetutamente da offerte.html per il live update).

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'sw.js');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preFixLoop.bak');
  console.log('[BAK] ' + f + '.preFixLoop.bak');
}

backup(FILE);
let content = readNorm(FILE);

const oldFetch = `self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});`;

const newFetch = `self.addEventListener('fetch', e => {
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
});`;

const before = content;
content = content.replace(oldFetch, newFetch);

if (content === before) {
  console.log('[WARN] Pattern fetch listener originale non trovato — verificare manualmente.');
  process.exit(1);
}

console.log('[OK] Fetch listener corretto: domini esterni esclusi + fallback Response invece di undefined.');

writeCRLF(FILE, content);

const check1 = content.includes('url.origin !== self.location.origin');
const check2 = content.includes("new Response('Risorsa non disponibile");
console.log(`[STAT] Esclusione domini esterni: ${check1 ? 'OK' : 'MANCANTE'}`);
console.log(`[STAT] Fallback Response invece di undefined: ${check2 ? 'OK' : 'MANCANTE'}`);
console.log('[DONE] File salvato con CRLF.');
