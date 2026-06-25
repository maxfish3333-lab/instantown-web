#!/usr/bin/env node
// insert-german-presentation.js
// Inserisce la sezione lang-de (gia' scritta e pronta) in
// instantown_presentation.html, dopo la sezione lang-fr esistente.
// Aggiunge anche il bottone lang-bar DE se non presente.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'instantown_presentation.html');
const GERMAN_CONTENT_FILE = path.join(__dirname, 'german_section_content.html');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preGermanPres.bak');
  console.log('[BAK] ' + f + '.preGermanPres.bak');
}

backup(FILE);
let html = readNorm(FILE);

if (html.includes('id="lang-de"')) {
  console.log('[SKIP] Sezione lang-de già presente.');
  process.exit(0);
}

const germanSection = readNorm(GERMAN_CONTENT_FILE);

// Inserisce subito dopo la chiusura della sezione lang-fr, prima di <script>
const insertRe = /(\n<\/div>\n\n<script>)/;
if (!insertRe.test(html)) {
  console.error('[ERROR] Punto di inserimento (chiusura prima di <script>) non trovato.');
  process.exit(1);
}
html = html.replace(insertRe, `\n</div>\n\n${germanSection}\n<script>`);
console.log('[OK] Sezione lang-de inserita.');

// Aggiunge bottone lang-bar DE se assente
if (!html.includes(`setLang('de'`)) {
  const frBtnRe = /(<button class="lang-btn" onclick="setLang\('fr',this\)">FR<\/button>)/;
  if (frBtnRe.test(html)) {
    html = html.replace(frBtnRe, `$1\n  <button class="lang-btn" onclick="setLang('de',this)">DE</button>`);
    console.log('[OK] Bottone lang-bar DE aggiunto.');
  } else {
    console.log('[WARN] Bottone FR lang-bar non trovato per inserire DE accanto.');
  }
} else {
  console.log('[SKIP] Bottone lang-bar DE già presente.');
}

writeCRLF(FILE, html);

const check = (html.match(/id="lang-de"/g) || []).length;
const btnCheck = (html.match(/setLang\('de'/g) || []).length;
console.log(`[STAT] Occorrenze id="lang-de": ${check} (atteso: 1)`);
console.log(`[STAT] Occorrenze bottone setLang('de'): ${btnCheck} (atteso: 1)`);
console.log('[DONE] File salvato con CRLF.');
