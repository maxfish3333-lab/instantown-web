#!/usr/bin/env node
// fix-i18n-offerte.js
// Corregge il bug nell'oggetto I18N di offerte.html:
// mancano le etichette en:, zh:, es:, fr: davanti ai rispettivi blocchi
// di traduzione (presenti e completi, ma orfani della chiave lingua).
//
// Strategia: il primo campo di ogni blocco lingua è sempre
// "offerteTitle:" — usiamo quello come ancora per inserire l'etichetta
// mancante subito dopo la chiusura del blocco precedente.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'offerte.html');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preI18Nfix.bak');
  console.log('[BAK] ' + f + '.preI18Nfix.bak');
}

backup(FILE);
let html = readNorm(FILE);

// Pattern: "  },\n    offerteTitle:" (chiusura blocco precedente seguita
// direttamente dal primo campo del blocco successivo, senza etichetta lingua)
// Sostituiamo con "  },\n  XX: {\n    offerteTitle:" dove XX è la lingua
// nell'ordine corretto: it (già ok) -> en -> zh -> es -> fr

const langOrder = ['en', 'zh', 'es', 'fr'];
let count = 0;

for (const lang of langOrder) {
  // Cerca la PRIMA occorrenza di "},\n    offerteTitle:" senza etichetta
  // (non già precedta da "lang: {")
  const pattern = /(\},\n)(\s*offerteTitle:)/;
  if (pattern.test(html)) {
    html = html.replace(pattern, `$1  ${lang}: {\n$2`);
    count++;
    console.log(`[OK] Etichetta "${lang}:" inserita (occorrenza ${count})`);
  } else {
    console.log(`[WARN] Pattern non trovato per ${lang} — potrebbe essere già corretto o struttura diversa`);
  }
}

writeCRLF(FILE, html);

// Verifica finale
const langLabels = (html.match(/^\s*(it|en|zh|es|fr):\s*\{/gm) || []);
console.log(`[STAT] Etichette lingua trovate nel file finale: ${langLabels.length}/5`);
langLabels.forEach(l => console.log('   ' + l.trim()));
console.log('[DONE] File salvato con CRLF.');
