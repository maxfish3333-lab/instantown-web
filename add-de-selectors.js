#!/usr/bin/env node
// add-de-selectors.js
// Aggiunge l'opzione/bottone "Tedesco (DE)" ai selettori lingua esistenti
// su tutte le pagine pubbliche che già supportano it/en/zh/es/fr.
// Gestisce sia <select><option> sia <button class="lbtn">.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preDeSel.bak');
  console.log('[BAK] ' + f + '.preDeSel.bak');
}

// ── Pattern 1: <select> con <option value="fr">...FR</option> ──
function patchSelectPattern(html, filename) {
  if (html.includes('value="de"')) {
    console.log(`[SKIP] ${filename}: opzione "de" già presente nel <select>`);
    return html;
  }
  // Cattura la riga <option value="fr">...FR</option> e duplica con de
  const frOptRe = /(\s*)<option value="fr">([^<]*)<\/option>/;
  const match = html.match(frOptRe);
  if (!match) return html;

  const indent = match[1];
  const deOption = `${indent}<option value="de">🇩🇪 DE</option>`;
  html = html.replace(frOptRe, match[0] + deOption);
  console.log(`[OK]   ${filename}: opzione <option value="de"> aggiunta dopo FR`);
  return html;
}

// ── Pattern 2: <button class="lbtn" data-lang="fr">...FR</button> ──
function patchButtonPattern(html, filename) {
  if (html.includes(`data-lang="de"`)) {
    console.log(`[SKIP] ${filename}: bottone "de" già presente`);
    return html;
  }
  // Cattura l'intero bottone FR (sia con flagcdn img sia semplice) e duplica
  const frBtnRe = /(<button onclick="applyLang\('fr'\)" class="lbtn"[^>]*data-lang="fr">[\s\S]*?<\/button>)/;
  const match = html.match(frBtnRe);
  if (!match) return html;

  const deBtn = match[1]
    .replace(/applyLang\('fr'\)/, "applyLang('de')")
    .replace(/data-lang="fr"/, 'data-lang="de"')
    .replace(/flagcdn\.com\/16x12\/fr\.png/, 'flagcdn.com/16x12/de.png')
    .replace(/alt="FR"/, 'alt="DE"')
    .replace(/>\s*FR<\/button>/, '> DE</button>');

  html = html.replace(frBtnRe, match[1] + '\n  ' + deBtn);
  console.log(`[OK]   ${filename}: bottone DE aggiunto dopo FR`);
  return html;
}

// ── Pattern 3: lang-bar style (instantown_presentation.html) ──
function patchLangBarPattern(html, filename) {
  if (html.includes(`setLang('de'`)) {
    console.log(`[SKIP] ${filename}: bottone lang-bar "de" già presente`);
    return html;
  }
  const frBtnRe = /(<button class="lang-btn" onclick="setLang\('fr',this\)">FR<\/button>)/;
  const match = html.match(frBtnRe);
  if (!match) return html;

  const deBtn = `<button class="lang-btn" onclick="setLang('de',this)">DE</button>`;
  html = html.replace(frBtnRe, match[1] + '\n  ' + deBtn);
  console.log(`[OK]   ${filename}: bottone lang-bar DE aggiunto dopo FR`);
  return html;
}

const FILES = [
  { name: 'index.html', type: 'button' },
  { name: 'map.html', type: 'select' },
  { name: 'offerte.html', type: 'select' },
  { name: 'servizi.html', type: 'select' },
  { name: 'registrazione.html', type: 'select' },
  { name: 'mio-account.html', type: 'select' },
  { name: 'instantown_presentation.html', type: 'langbar' },
];

console.log('[START] add-de-selectors');

for (const f of FILES) {
  const filePath = path.join(ROOT, f.name);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] ${f.name}: file non trovato`);
    continue;
  }
  let html = readNorm(filePath);
  const before = html;

  if (f.type === 'select') html = patchSelectPattern(html, f.name);
  else if (f.type === 'button') html = patchButtonPattern(html, f.name);
  else if (f.type === 'langbar') html = patchLangBarPattern(html, f.name);

  if (html !== before) {
    backup(filePath);
    writeCRLF(filePath, html);
  } else {
    console.log(`[WARN] ${f.name}: nessuna modifica applicata (pattern non trovato o già presente)`);
  }
}

console.log('[DONE]');
