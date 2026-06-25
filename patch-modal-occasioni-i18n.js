#!/usr/bin/env node
// patch-modal-occasioni-i18n.js
// Aggiunge data-i18n al modale "Occasioni flash" di index.html, che era
// completamente fuori dal sistema di traduzione (testo hardcoded).
// Usa il dizionario locale I18N esistente, aggiungendo nuove chiavi
// per ciascuna delle 5 lingue + tedesco.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'index.html');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preModalFix.bak');
  console.log('[BAK] ' + f + '.preModalFix.bak');
}

// Nuove chiavi per il modale, in tutte le 6 lingue
const KEYS = {
  'modal-occ-title': { it:'⚡ Occasioni flash', en:'⚡ Flash deals', zh:'⚡ 闪购优惠', es:'⚡ Ofertas flash', fr:'⚡ Offres flash', de:'⚡ Blitzangebote' },
  'cat-name-cibo': { it:'Cibo', en:'Food', zh:'美食', es:'Comida', fr:'Nourriture', de:'Essen' },
  'cat-name-moda': { it:'Moda', en:'Fashion', zh:'时尚', es:'Moda', fr:'Mode', de:'Mode' },
  'cat-name-tech': { it:'Tech', en:'Tech', zh:'科技', es:'Tech', fr:'Tech', de:'Tech' },
  'cat-name-viaggi': { it:'Viaggi', en:'Travel', zh:'旅游', es:'Viajes', fr:'Voyages', de:'Reisen' },
  'cat-name-divertimento': { it:'Divertimento', en:'Entertainment', zh:'娱乐', es:'Entretenimiento', fr:'Divertissement', de:'Unterhaltung' },
  'cat-name-altro': { it:'Altro', en:'Other', zh:'其他', es:'Otro', fr:'Autre', de:'Sonstiges' },
  'modal-vedi-tutte': { it:'Vedi tutte le offerte →', en:'See all offers →', zh:'查看所有优惠 →', es:'Ver todas las ofertas →', fr:'Voir toutes les offres →', de:'Alle Angebote ansehen →' },
  'modal-pref-prefix': { it:'Preferenze:', en:'Preferences:', zh:'偏好：', es:'Preferencias:', fr:'Préférences :', de:'Präferenzen:' },
  'modal-pref-modifica': { it:'modifica', en:'edit', zh:'修改', es:'editar', fr:'modifier', de:'bearbeiten' },
};

backup(FILE);
let html = readNorm(FILE);

if (html.includes('id="modal-occ-title"')) {
  console.log('[SKIP] Modale già patchato con data-i18n.');
  process.exit(0);
}

// ── 1. Titolo modale ──
html = html.replace(
  /<span class="modal-title">&#x26A1; Occasioni flash<\/span>/,
  '<span class="modal-title" id="modal-occ-title">⚡ Occasioni flash</span>'
);

// ── 2. Nomi categorie nelle card del modale ──
const catMap = {
  CIBO: 'cat-name-cibo', MODA: 'cat-name-moda', TECH: 'cat-name-tech',
  VIAGGI: 'cat-name-viaggi', DIVERTIMENTO: 'cat-name-divertimento', ALTRO: 'cat-name-altro'
};
for (const [catCode, key] of Object.entries(catMap)) {
  const re = new RegExp(`(id="cat-${catCode}">[\\s\\S]*?<div class="cat-name-modal">)([^<]+)(</div>)`);
  html = html.replace(re, (m, open, name, close) => {
    return open.replace('<div class="cat-name-modal">', `<div class="cat-name-modal" id="${key}">`) + name + close;
  });
}

// ── 3. Bottone "Vedi tutte le offerte" ──
html = html.replace(
  /(<a href="offerte\.html" style="[^"]*" onmouseover="this\.style\.background='var\(--rosso-l\)'" onmouseout="this\.style\.background='var\(--rosso\)'">)Vedi tutte le offerte â†’(<\/a>)/,
  '$1<span id="modal-vedi-tutte">Vedi tutte le offerte →</span>$2'
);

console.log('[OK] data-i18n/id aggiunti al modale Occasioni flash.');

// ── 4. Aggiunge le nuove chiavi a ciascuna sezione lingua del dizionario locale I18N ──
const langs = ['it', 'en', 'zh', 'es', 'fr', 'de'];
for (const lang of langs) {
  const lines = Object.entries(KEYS).map(([k, v]) => `    '${k}': ${JSON.stringify(v[lang])}`);
  const block = lines.join(',\n');

  // Trova la sezione "  lang: { ... }" e inserisce le nuove chiavi prima della chiusura
  const sectionRe = new RegExp(`(  ${lang}: \\{)([\\s\\S]*?)(\\n  \\}[,;]?)`, 'm');
  html = html.replace(sectionRe, (m, open, body, close) => {
    if (body.includes("'modal-occ-title'")) return m; // già presente
    const trimmedBody = body.replace(/,\s*$/, '');
    return open + trimmedBody + ',\n' + block + close;
  });
}
console.log('[OK] Nuove chiavi modale inserite in tutte le 6 lingue del dizionario locale.');

writeCRLF(FILE, html);

const check1 = (html.match(/id="modal-occ-title"/g) || []).length;
const check2 = (html.match(/'modal-occ-title':/g) || []).length;
console.log(`[STAT] id="modal-occ-title" nel template: ${check1} (atteso: 1)`);
console.log(`[STAT] Chiave 'modal-occ-title' nel dizionario: ${check2} (atteso: 6 = 6 lingue)`);
console.log('[DONE] File salvato con CRLF.');
