#!/usr/bin/env node
// add-de-selector-offerte.js
// Aggiunge il bottone DE al selettore lingua multi-riga di offerte.html
// (pattern diverso da index.html: button + style su righe separate)

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
  fs.copyFileSync(f, f + '.preDeSelOfferte.bak');
  console.log('[BAK] ' + f + '.preDeSelOfferte.bak');
}

backup(FILE);
let html = readNorm(FILE);

if (html.includes(`data-lang="de"`)) {
  console.log('[SKIP] Bottone "de" già presente in offerte.html');
  process.exit(0);
}

const frBtnRe = /(  <button onclick="applyLang\('fr'\)" class="lbtn" data-lang="fr"\n    style="[^\n]*\n    [^\n]*>[^<]*<\/button>)/;
const match = html.match(frBtnRe);

if (!match) {
  console.log('[WARN] Pattern bottone FR multi-riga non trovato. Verificare manualmente.');
  process.exit(1);
}

const deBtn = match[1]
  .replace(/applyLang\('fr'\)/, "applyLang('de')")
  .replace(/data-lang="fr"/, 'data-lang="de"')
  .replace(/>[^<]*<\/button>$/, '>🇩🇪 DE</button>')
  .replace(/^<button/, '<button');

html = html.replace(frBtnRe, match[1] + '\n  ' + deBtn);
console.log('[OK] Bottone DE aggiunto dopo FR in offerte.html');

writeCRLF(FILE, html);

const check = (html.match(/data-lang="de"/g) || []).length;
console.log(`[STAT] Occorrenze data-lang="de": ${check} (atteso: 1)`);
console.log('[DONE] File salvato con CRLF.');
