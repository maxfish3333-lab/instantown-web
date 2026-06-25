#!/usr/bin/env node
// add-sv-keys-german.js
// Aggiunge le chiavi sv_* (servizi.html Fase 1) alla sezione "de:"
// del dizionario IT18N in i18n.js, che ne era priva perché creata
// dopo il commit del tedesco.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'i18n.js');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preSvDe.bak');
  console.log('[BAK] ' + f + '.preSvDe.bak');
}

const SV_DE = {
  sv_title: 'Wesentliche Dienste',
  sv_gps_loading: 'GPS-Position wird ermittelt...',
  sv_gps_dots: 'GPS...',
  sv_gps_attivo: 'GPS aktiv',
  sv_gps_nd: 'GPS nicht verfügbar',
  sv_gps_default: 'Rom (Standard)',
  sv_filtro_tutti: '🗂 Alle',
  sv_filtro_pubblico: '💧 Öffentliche Dienste',
  sv_filtro_iconico: '🛍 Ikonische Orte',
  sv_btn_portami: 'BRING MICH HIN',
  sv_dist_da_te: 'von dir',
};

backup(FILE);
let content = readNorm(FILE);

if (content.includes('sv_title: "Wesentliche Dienste"')) {
  console.log('[SKIP] Chiavi sv_* già presenti in tedesco.');
  process.exit(0);
}

const lines = Object.entries(SV_DE).map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`);
const block = lines.join(',\n');

// Trova la sezione "de: {" e inserisce le chiavi prima della sua chiusura "  },"
const deRe = /(  de: \{[\s\S]*?)(\n  \},\n)/;
if (!deRe.test(content)) {
  console.error('[ERROR] Sezione "de:" non trovata.');
  process.exit(1);
}
content = content.replace(deRe, (match, body, closing) => {
  return body.replace(/,\s*$/, '') + ',\n' + block + closing;
});
console.log('[OK] Chiavi sv_* inserite nella sezione "de:" (' + Object.keys(SV_DE).length + ' chiavi).');

writeCRLF(FILE, content);

const check = (content.match(/sv_title:/g) || []).length;
console.log(`[STAT] Occorrenze "sv_title:" nel file finale: ${check} (atteso: 6 = it/en/zh/es/fr/de)`);
console.log('[DONE] File salvato con CRLF.');
