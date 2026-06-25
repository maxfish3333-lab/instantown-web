#!/usr/bin/env node
// add-german-offerte-local.js
// Aggiunge la sezione "de:" al dizionario locale I18N di offerte.html
// (oggetto separato da IT18N in i18n.js, con offerteTitle, statoAttiva,
// btnAttivaGaranzia, ecc.)

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
  fs.copyFileSync(f, f + '.preGermanLocal.bak');
  console.log('[BAK] ' + f + '.preGermanLocal.bak');
}

const DE = {
  offerteTitle: 'Blitzangebote',
  liveUpdate: 'Live-Aktualisierung',
  loading: 'Angebote werden geladen...',
  noOffers: 'Keine Angebote für diese Auswahl.',
  catTutte: 'Alle',
  catCibo: 'Essen',
  catModa: 'Mode',
  catTech: 'Tech',
  catViaggi: 'Reisen',
  catDivert: 'Unterhaltung',
  catAltro: 'Sonstiges',
  subTutte: 'Alle',
  subAttive: 'Nur aktive',
  subScadute: 'Abgelaufen',
  raggioLabel: 'Radius:',
  raggioTutti: 'Alle',
  statTotali: 'Angebote insgesamt',
  statAttive: 'Jetzt aktiv',
  statRisparmio: 'Durchschn. Ersparnis',
  statAnomalie: 'Zu prüfen',
  btnPrenota: 'Buchen →',
  btnMessageggia: '💬 Nachricht',
  orarioNd: 'Uhrzeit n/a',
  prefLabel: 'Deine Präferenzen:',
  prefModifica: 'Bearbeiten',
  anomTag: '⚠ prüfen',
  adminReview: 'Admin-Prüfung',
  navBack: '← Startseite',
  langLabel: 'Sprache',
  footerText: 'Tabelle: Angebote · Rom, 2025',
  datiLocali: 'lokale Daten (Tabelle nicht erreichbar)',
  aggiornato: 'aktualisiert: ',
  ciRipenso: 'Ich überlege es mir',
  ovIndirizzo: 'Adresse',
  ovOrario: 'Uhrzeit',
  ovCategoria: 'Kategorie',
  ovRaggio: 'Radius',
  ovPrezzoFlash: 'Blitzpreis',
  ovPrezzoStd: 'Standardpreis',
  ovConferma: 'Bestätigen und buchen →',
  statoAttiva: 'AKTIV',
  statoScaduta: 'ABGELAUFEN',
  btnAttivaGaranzia: '🔐 Bankgarantie aktivieren →',
};

backup(FILE);
let html = readNorm(FILE);

if (html.includes('offerteTitle:   \'Blitzangebote\'') || /de:\s*\{/.test(html.match(/const I18N = \{[\s\S]*?\n\};/)?.[0] || '')) {
  console.log('[SKIP] Sezione "de:" già presente nel dizionario locale I18N.');
  process.exit(0);
}

const lines = Object.entries(DE).map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`);
const deBlock = '\n  de: {\n' + lines.join(',\n') + '\n  },';

// Inserisce dopo la chiusura della sezione "fr: { ... }" del dizionario
// locale I18N (NON di IT18N), individuata cercando "const I18N = {" come ancora
const i18nObjRe = /(const I18N = \{[\s\S]*?\n  fr: \{[\s\S]*?\n  \})(\n\};)/;
const match = html.match(i18nObjRe);

if (!match) {
  console.error('[ERROR] Non trovo la sezione fr: dentro "const I18N = {...}". Verificare manualmente.');
  process.exit(1);
}

html = html.replace(i18nObjRe, (m, frPart, closing) => frPart + ',' + deBlock + closing);
console.log('[OK] Sezione "de:" inserita nel dizionario locale I18N di offerte.html (' + Object.keys(DE).length + ' chiavi).');

writeCRLF(FILE, html);

const check = (html.match(/\n  de: \{/g) || []).length;
console.log(`[STAT] Sezioni "de:" trovate nel file: ${check}`);
console.log('[DONE] File salvato con CRLF.');
