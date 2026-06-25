#!/usr/bin/env node
// fix-whitelist-de-tutti-file.js
// Corregge la whitelist lingue in TUTTE le funzioni applyLang() locali
// che non includevano 'de' - bug che resetta silenziosamente la lingua
// a 'it' ogni volta che si arriva su quella pagina con tedesco impostato.
// Controlla: offerte.html, servizi.html (e qualsiasi altro pattern simile).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const FILES = ['offerte.html', 'servizi.html', 'registrazione.html', 'mio-account.html', 'map.html'];

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preWhitelistFix.bak');
  console.log('[BAK] ' + f + '.preWhitelistFix.bak');
}

const patterns = [
  { re: /var ok = \['it','en','zh','es','fr'\];/g, repl: "var ok = ['it','en','zh','es','fr','de'];" },
  { re: /const ok = \['it','en','zh','es','fr'\];/g, repl: "const ok = ['it','en','zh','es','fr','de'];" },
  { re: /\['it', ?'en', ?'zh', ?'es', ?'fr'\]/g, repl: "['it','en','zh','es','fr','de']" },
];

console.log('[START] fix-whitelist-de-tutti-file\n');

for (const fname of FILES) {
  const filePath = path.join(ROOT, fname);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] ${fname}: file non trovato`);
    continue;
  }
  let html = readNorm(filePath);
  const before = html;
  let fixedCount = 0;

  for (const p of patterns) {
    const matches = html.match(p.re);
    if (matches) {
      html = html.replace(p.re, p.repl);
      fixedCount += matches.length;
    }
  }

  if (html !== before) {
    backup(filePath);
    writeCRLF(filePath, html);
    console.log(`[OK]   ${fname}: ${fixedCount} whitelist corrette (aggiunto "de")`);
  } else {
    console.log(`[INFO] ${fname}: nessuna whitelist incompleta trovata (già ok o pattern diverso)`);
  }
}

console.log('\n[DONE]');
