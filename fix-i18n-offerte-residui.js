#!/usr/bin/env node
// fix-i18n-offerte-residui.js
// Completa la traduzione di offerte.html per:
// 1. Badge stato "ATTIVA" / "SCADUTA" (overlay dettaglio + lista)
// 2. Bottone "Attiva Garanzia Bancaria" nell'overlay
// 3. Categoria nell'overlay (badge in alto, es. "CIBO")
//
// Aggiunge chiavi al dizionario I18N esistente (statoAttiva, statoScaduta,
// btnAttivaGaranzia) per tutte le 5 lingue, poi collega il codice JS
// a usare t() invece di stringhe hardcoded.

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
  fs.copyFileSync(f, f + '.preResidui.bak');
  console.log('[BAK] ' + f + '.preResidui.bak');
}

// Traduzioni nuove chiavi per le 5 lingue
const NEW_KEYS = {
  it: { statoAttiva: 'ATTIVA', statoScaduta: 'SCADUTA', btnAttivaGaranzia: '🔐 Attiva Garanzia Bancaria →' },
  en: { statoAttiva: 'ACTIVE', statoScaduta: 'EXPIRED', btnAttivaGaranzia: '🔐 Activate Bank Guarantee →' },
  zh: { statoAttiva: '进行中', statoScaduta: '已过期', btnAttivaGaranzia: '🔐 启用银行担保 →' },
  es: { statoAttiva: 'ACTIVA', statoScaduta: 'CADUCADA', btnAttivaGaranzia: '🔐 Activar Garantía Bancaria →' },
  fr: { statoAttiva: 'ACTIVE', statoScaduta: 'EXPIRÉE', btnAttivaGaranzia: '🔐 Activer la Garantie Bancaire →' },
};

backup(FILE);
let html = readNorm(FILE);

// ── 1. Inserisci le nuove chiavi in ciascun blocco lingua, prima della chiusura "  },"
const langOrder = ['it', 'en', 'zh', 'es', 'fr'];
let keysInserted = 0;

for (const lang of langOrder) {
  const keys = NEW_KEYS[lang];
  const newLine = `    statoAttiva: ${JSON.stringify(keys.statoAttiva)}, statoScaduta: ${JSON.stringify(keys.statoScaduta)}, btnAttivaGaranzia: ${JSON.stringify(keys.btnAttivaGaranzia)},\n`;

  // Trova il blocco "  lang: {" ... fino alla sua chiusura "  },study" o "  }"
  const langRe = new RegExp(`(  ${lang}: \\{[\\s\\S]*?)(\\n  \\}[,;]?)`, 'm');
  const match = html.match(langRe);
  if (match) {
    // Verifica che non sia già stato applicato
    if (match[1].includes('statoAttiva')) {
      console.log(`[SKIP] ${lang}: chiavi già presenti`);
      continue;
    }
    html = html.replace(langRe, (full, body, closing) => body + '\n' + newLine.trimEnd() + closing);
    keysInserted++;
    console.log(`[OK] Chiavi inserite per lingua "${lang}"`);
  } else {
    console.log(`[WARN] Blocco lingua "${lang}" non trovato`);
  }
}

// ── 2. Sostituisci il bottone hardcoded con chiamata a t()
const btnPattern = /<a href="\$\{checkoutUrl\}" class="btn-conferma">🔐 Attiva Garanzia Bancaria →<\/a>/;
if (btnPattern.test(html)) {
  html = html.replace(btnPattern, '<a href="${checkoutUrl}" class="btn-conferma">${t(\'btnAttivaGaranzia\')}</a>');
  console.log('[OK] Bottone "Attiva Garanzia Bancaria" collegato a t()');
} else {
  console.log('[WARN] Pattern bottone non trovato (forse già corretto)');
}

// ── 3. Sostituisci i badge stato ATTIVA/SCADUTA con traduzione dinamica
// Pattern: <span class="pill-stato ${...}">${o.stato}</span>
const statoPattern = /\$\{o\.stato\}/g;
const statoMatches = html.match(statoPattern);
if (statoMatches) {
  html = html.replace(statoPattern, "${o.stato==='ATTIVA' ? t('statoAttiva') : t('statoScaduta')}");
  console.log(`[OK] ${statoMatches.length} badge stato collegati a t()`);
} else {
  console.log('[WARN] Nessun badge stato trovato (forse già corretto)');
}

writeCRLF(FILE, html);

// STAT finale
const finalCount = (html.match(/statoAttiva/g) || []).length;
console.log(`[STAT] Occorrenze "statoAttiva" nel file finale: ${finalCount} (atteso: 5 dizionario + 2 uso = 7)`);
console.log('[DONE] File salvato con CRLF.');
