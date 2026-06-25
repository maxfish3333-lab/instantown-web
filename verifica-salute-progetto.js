#!/usr/bin/env node
// verifica-salute-progetto.js
// Script di controllo rapido da lanciare a INIZIO di ogni sessione,
// prima di iniziare a modificare qualcosa. Verifica che le strutture
// i18n critiche siano tutte presenti e coerenti su tutti i file.
//
// USO: node verifica-salute-progetto.js
// Se tutto è verde, procedi tranquillo. Se c'è anche un solo [FAIL],
// fermati e segnalalo prima di continuare a lavorare.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
let failCount = 0;
let warnCount = 0;

function check(label, condition, severity = 'FAIL') {
  if (condition) {
    console.log(`[OK]   ${label}`);
  } else {
    console.log(`[${severity}] ${label}`);
    if (severity === 'FAIL') failCount++;
    else warnCount++;
  }
}

function readFile(name) {
  const p = path.join(ROOT, name);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

console.log('═══════════════════════════════════════════');
console.log('  VERIFICA SALUTE PROGETTO — InstantTown');
console.log('═══════════════════════════════════════════\n');

// ── 1. i18n.js: 6 lingue presenti e coerenti ──
console.log('--- i18n.js (dizionario base) ---');
const i18n = readFile('i18n.js');
if (i18n === null) {
  console.log('[FAIL] i18n.js non trovato!');
  failCount++;
} else {
  const langs = ['it', 'en', 'zh', 'es', 'fr', 'de'];
  const langLabels = (i18n.match(/^\s{2}(it|en|zh|es|fr|de):\s*\{/gm) || []);
  check('6 etichette lingua presenti (it/en/zh/es/fr/de)', langLabels.length === 6,
    langLabels.length === 6 ? 'OK' : 'FAIL');

  // Verifica che ogni lingua abbia lo stesso numero di chiavi (circa)
  for (const lang of langs) {
    const sectionRe = new RegExp(`  ${lang}: \\{([\\s\\S]*?)\\n  \\}`, 'm');
    const match = i18n.match(sectionRe);
    const keyCount = match ? (match[1].match(/^\s{4}\w+:/gm) || []).length : 0;
    check(`Sezione "${lang}" ha chiavi (${keyCount} trovate)`, keyCount > 100, keyCount > 50 ? 'WARN' : 'FAIL');
  }

  // Nessun marker di conflitto Git residuo
  check('Nessun marker di conflitto Git (<<<<<<<)', !i18n.includes('<<<<<<<'));
  check('rilevaLingua() riconosce "de"', i18n.includes("startsWith('de')"), 'WARN');
}

// ── 2. offerte.html: dizionario locale + funzioni critiche ──
console.log('\n--- offerte.html ---');
const offerte = readFile('offerte.html');
if (offerte === null) {
  console.log('[FAIL] offerte.html non trovato!');
  failCount++;
} else {
  const localLangs = (offerte.match(/^\s{2}(it|en|zh|es|fr|de):\s*\{/gm) || []);
  check('Dizionario locale I18N: 6 lingue presenti', localLangs.length === 6,
    localLangs.length >= 5 ? 'WARN' : 'FAIL');
  check('Funzione traduciCategoria() presente', offerte.includes('function traduciCategoria'));
  check('Bottone selettore lingua DE presente', offerte.includes('data-lang="de"'), 'WARN');
  check('Nessun marker di conflitto Git', !offerte.includes('<<<<<<<'));
  check('btnAttivaGaranzia collegato a t()', offerte.includes("t('btnAttivaGaranzia')"));
}

// ── 3. servizi.html ──
console.log('\n--- servizi.html ---');
const servizi = readFile('servizi.html');
if (servizi === null) {
  console.log('[FAIL] servizi.html non trovato!');
  failCount++;
} else {
  check('Collegato a i18n.js', servizi.includes('<script src="i18n.js">'));
  check('Selettore lingua presente', servizi.includes('id="lang-sel"'));
  check('data-i18n presenti (Fase 1)', (servizi.match(/data-i18n=/g) || []).length >= 7, 'WARN');
}

// ── 4. registrazione.html ──
console.log('\n--- registrazione.html ---');
const reg = readFile('registrazione.html');
if (reg === null) {
  console.log('[FAIL] registrazione.html non trovato!');
  failCount++;
} else {
  check('Collegato a i18n.js', reg.includes('<script src="i18n.js">'));
  check('Endpoint Apps Script presente', reg.includes('script.google.com/macros'));
  check('Selettore lingua DE presente', reg.includes('value="de"'), 'WARN');
}

// ── 5. mio-account.html ──
console.log('\n--- mio-account.html ---');
const mioAcc = readFile('mio-account.html');
if (mioAcc === null) {
  console.log('[FAIL] mio-account.html non trovato!');
  failCount++;
} else {
  check('data-i18n presenti', (mioAcc.match(/data-i18n=/g) || []).length >= 13, 'WARN');
  check('Funzione i18nGet() presente', mioAcc.includes('function i18nGet'));
}

// ── 6. chat.html e chat-esercente.html ──
console.log('\n--- chat.html / chat-esercente.html ---');
const chat = readFile('chat.html');
const chatEs = readFile('chat-esercente.html');
if (chat === null) {
  console.log('[FAIL] chat.html non trovato!');
  failCount++;
} else {
  check('Frasi rapide (QUICK_PHRASES) presenti', chat.includes('QUICK_PHRASES'));
  check('testoVisualizzato() presente', chat.includes('function testoVisualizzato'));
}
if (chatEs === null) {
  console.log('[FAIL] chat-esercente.html non trovato!');
  failCount++;
} else {
  check('Nome tab Sheet corretto (anagrafica_negozi)', chatEs.includes('sheet=anagrafica_negozi'));
  check('Nessun riferimento a tab errata (anagrafica%20negozi)', !chatEs.includes('anagrafica%20negozi'));
  check('testoVisualizzato() presente (lato esercente)', chatEs.includes('function testoVisualizzato'));
}

// ── 7. instantown_presentation.html ──
console.log('\n--- instantown_presentation.html ---');
const pres = readFile('instantown_presentation.html');
if (pres === null) {
  console.log('[FAIL] instantown_presentation.html non trovato!');
  failCount++;
} else {
  const sections = (pres.match(/id="lang-(it|en|zh|es|fr|de)"/g) || []);
  check('6 sezioni lingua presenti', sections.length === 6, sections.length >= 5 ? 'WARN' : 'FAIL');
}

// ── RIEPILOGO FINALE ──
console.log('\n═══════════════════════════════════════════');
if (failCount === 0 && warnCount === 0) {
  console.log('  ✅ TUTTO OK — puoi procedere tranquillo.');
} else if (failCount === 0) {
  console.log(`  ⚠️  ${warnCount} avviso(i) non bloccante(i) — procedi con attenzione.`);
} else {
  console.log(`  ❌ ${failCount} ERRORE(I) CRITICO(I) — fermati e investiga prima di continuare!`);
}
console.log('═══════════════════════════════════════════');
