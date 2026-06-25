#!/usr/bin/env node
// fix-applylang-localstorage-index.js
// Risolve due bug critici in index.html:
// 1. applyLang() locale non riconosce 'de' (whitelist incompleta) e non
//    salva la lingua scelta in localStorage (manca setItem).
// 2. localStorage.clear() ad ogni DOMContentLoaded cancella TUTTO lo
//    storage (PIN utente, prenotazioni, lingua, ecc.) - comportamento
//    distruttivo, va rimosso.

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
  fs.copyFileSync(f, f + '.preApplyLangFix.bak');
  console.log('[BAK] ' + f + '.preApplyLangFix.bak');
}

backup(FILE);
let html = readNorm(FILE);

// ── FIX 1: whitelist lingue + salvataggio in localStorage ──
const oldApplyLang = `function applyLang(lang) {
  var ok = ['it','en','zh','es','fr'];
  if (!ok.includes(lang)) lang = 'it';
  var L = I18N[lang] || I18N.it;`;

const newApplyLang = `function applyLang(lang) {
  var ok = ['it','en','zh','es','fr','de'];
  if (!ok.includes(lang)) lang = 'it';
  localStorage.setItem('it_lang', lang);
  var L = I18N[lang] || I18N.it;`;

if (html.includes(oldApplyLang)) {
  html = html.replace(oldApplyLang, newApplyLang);
  console.log('[OK] applyLang() corretta: whitelist include "de" + salvataggio localStorage aggiunto.');
} else {
  console.log('[WARN] Pattern applyLang() originale non trovato — verificare manualmente.');
}

// ── FIX 2: rimuove localStorage.clear() distruttivo ──
const oldInit = `document.addEventListener('DOMContentLoaded', function() {
  localStorage.clear();
  applyLang('it');
});`;

const newInit = `document.addEventListener('DOMContentLoaded', function() {
  var lang = localStorage.getItem('it_lang') || 'it';
  applyLang(lang);
});`;

if (html.includes(oldInit)) {
  html = html.replace(oldInit, newInit);
  console.log('[OK] localStorage.clear() rimosso. Ora la home rispetta la lingua salvata invece di forzare IT.');
} else {
  console.log('[WARN] Pattern DOMContentLoaded originale non trovato — verificare manualmente.');
}

writeCRLF(FILE, html);

const check1 = html.includes("['it','en','zh','es','fr','de']");
const check2 = html.includes("localStorage.setItem('it_lang', lang);\n  var L");
const check3 = !html.includes('localStorage.clear();');
console.log(`[STAT] Whitelist con "de": ${check1 ? 'OK' : 'MANCANTE'}`);
console.log(`[STAT] Salvataggio localStorage in applyLang: ${check2 ? 'OK' : 'MANCANTE'}`);
console.log(`[STAT] localStorage.clear() rimosso: ${check3 ? 'OK' : 'ANCORA PRESENTE'}`);
console.log('[DONE] File salvato con CRLF.');
