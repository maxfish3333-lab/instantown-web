#!/usr/bin/env node
// fix-chat-esercente-tabname.js
// Corregge il nome della tab Google Sheet usato per verificare il PIN
// esercente: da "anagrafica%20negozi" (con spazio) a "anagrafica_negozi"
// (con underscore, il nome reale della tab).

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'chat-esercente.html');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preTabFix.bak');
  console.log('[BAK] ' + f + '.preTabFix.bak');
}

backup(FILE);
let html = readNorm(FILE);

const before = html;
html = html.replace(/sheet=anagrafica%20negozi/g, 'sheet=anagrafica_negozi');

if (html === before) {
  console.log('[WARN] Pattern "anagrafica%20negozi" non trovato — verificare manualmente.');
} else {
  console.log('[OK] Nome tab corretto: anagrafica%20negozi -> anagrafica_negozi');
}

writeCRLF(FILE, html);

const check = (html.match(/sheet=anagrafica_negozi/g) || []).length;
console.log(`[STAT] Occorrenze "sheet=anagrafica_negozi": ${check} (atteso: 1)`);
console.log('[DONE] File salvato con CRLF.');
