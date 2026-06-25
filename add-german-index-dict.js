#!/usr/bin/env node
// add-german-index-dict.js
// Aggiunge la sezione "de:" al dizionario locale I18N di index.html
// (sezione VIP, FINDER, "come funziona", footer - diversa da IT18N
// di i18n.js, contenuto specifico della home).

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
  fs.copyFileSync(f, f + '.preGermanIndex.bak');
  console.log('[BAK] ' + f + '.preGermanIndex.bak');
}

const DE = {
  'vip-title': 'Der Nutzer ist immer VIP',
  'vip-sub': '— zahlt nie, wenn das Produkt oder die Dienstleistung nicht erhalten wird',
  'nav-reg': 'Als Geschäft registrieren →',
  'hero-kicker': 'Rom — Pilotstadt 2025',
  'hero-title': 'Die Welt<br><em>zu deinen Füßen.</em>',
  'hero-desc': 'Blitzangebote im Umkreis von 200 Metern, öffentliche Dienste auf der Karte, garantierte Zahlungen. INSTANTOWN verbindet Bürger, Touristen und Geschäfte in Echtzeit.',
  'b1t': 'Echte Nähe, keine Werbung',
  'b1d': 'Das GPS berechnet, was sich um dich befindet. Nur physische Geschäfte, die zu Fuß erreichbar sind.',
  'b2t': 'Zahlung in Treuhandschaft, fester Preis',
  'b2d': 'Das Geld bleibt eingefroren bis zum physischen Treffen. Der angezeigte Preis ist der Preis, den du zahlst.',
  'b3t': 'Integrierte öffentliche Dienste',
  'b3d': 'Trinkbrunnen, öffentliche Toiletten, kostenloses Wi-Fi auf derselben Karte. Rom immer nur einen Klick entfernt.',
  'b4t': 'Betrugssicher by Design',
  'b4d': 'Jedes Geschäft wird mit echter USt-IdNr. verifiziert. Der doppelte physische QR-Code macht Betrug unmöglich.',
  'vip1-t': 'Der Nutzer ist immer VIP',
  'vip1-d': 'Zahlt nie, wenn das Produkt oder die Dienstleistung nicht erhalten wird. Die Gelder bleiben in Treuhandschaft bis zum physischen Treffen. Wenn etwas schiefgeht, verlierst du nichts.',
  'vip2-t': 'Das Geschäft schießt nichts vor',
  'vip2-d': 'Keine Abonnements. Keine Gebühren. Keine Einrichtung. Gebühr nur auf reale Umsätze — 1,75 % beim Einkassieren, 0 % in den ersten 6 Monaten.',
  'vip3-t': 'INSTANTOWN verdient nur, wenn ihr verdient',
  'vip3-d': 'Alle technologischen, rechtlichen und betrieblichen Kosten trägt INSTANTOWN. Das Risiko liegt bei uns. Der Gewinn gehört euch.',
  'vip-quote': '„Niemand zahlt im Voraus.<br><span style="color:var(--ocra-l)">INSTANTOWN verdient nur, wenn ihr verdient.</span>“',
  'btn1-label': 'Wesentliche Dienste',
  'btn1-sub': 'Trinkbrunnen · Toiletten · Wi-Fi<br>Ikonische Orte Roms',
  'btn2-label': 'Blitzangebote',
  'btn2-sub': 'Essen · Mode · Tech · Reisen<br>Unterhaltung · Sonstiges',
  'finder-badge': 'Demnächst — Phase 2',
  'finder-sub': 'Der nationale Markt, der dich nie gesehen hat.',
  'finder-desc': 'Es gibt Tausende von Unternehmen in Italien, die Exzellenz produzieren — Weine, Käse, Keramik, mechanische Arbeiten, Stoffe, Konserven — die nie Zugang zu nationalen und internationalen Märkten hatten. Nicht aus Mangel an Qualität. Aus Mangel an Bühne.',
  'f1t': 'Der kleine Ort findet den großen Markt',
  'f1d': 'Ein Nduja-Produzent in Kalabrien, eine Ölmühle in Molise, ein Keramikhandwerker in der Basilikata. Mit FINDER gelangen sie in den nationalen Katalog und werden von denen gefunden, die sie suchen — ohne Messen, ohne Agenten, ohne teure Vermittler.',
  'f2t': 'Der Vermittler hat schon den Kunden',
  'f2d': 'Der Finder ist jemand, der bereits einen interessierten Käufer hat und im ATECO-2025-Katalog den besten Lieferanten sucht. Kauft und verkauft mit freier Gewinnspanne weiter. Die Treuhandzahlung schützt beide Parteien bis zur Lieferung.',
  'f3t': 'Steuerlich transparent',
  'f3d': 'Unter 5.000 €/Jahr: gelegentliches Einkommen gemäß Art. 67 TUIR, null Bürokratie. Über der Schwelle: INSTANTOWN überwacht und benachrichtigt in Echtzeit über die Pflicht zur Eröffnung einer USt-IdNr.',
  'finder-south-t': 'Süditalien — Startpriorität',
  'finder-south-d': 'Kampanien, Kalabrien, Sizilien, Apulien, Basilikata, Molise, Abruzzen — die Regionen mit der höchsten Konzentration an produktiver Exzellenz ohne Marktzugang werden als erste in den FINDER-Katalog integriert.',
  'how-badge': 'PROX — So funktioniert es',
  'how-title': 'Drei Schritte. Nicht mehr.',
  's1t': 'Radar öffnen',
  's1d': 'Das GPS findet Blitzangebote von Geschäften im Umkreis von 200 Metern — genau jetzt, in dieser Straße.',
  's2t': 'Buchen und in Treuhandschaft zahlen',
  's2d': 'Der Preis wird bei der Buchung festgelegt. Die Zahlung geht in Treuhandschaft — niemand rührt sie an, bis du das Geschäft triffst.',
  's3t': 'QR-Abgleich — Gelder freigegeben',
  's3d': 'Das Geschäft zeigt QR-A, du scannst QR-B. Nur das physische Paar gibt die Gelder frei. Unmöglich zu betrügen.',
  'radar-btn': 'GPS-Radar öffnen →',
  'ft-offerte': 'Angebote',
  'ft-servizi': 'Dienste',
  'ft-reg': 'Registrieren',
  'ft-pubblica': 'Angebot veröffentlichen',
  'ft-finder': 'FINDER — demnächst',
};

backup(FILE);
let html = readNorm(FILE);

if (html.includes("\n  de: {")) {
  console.log('[SKIP] Sezione "de:" già presente nel dizionario locale I18N di index.html.');
  process.exit(0);
}

const lines = Object.entries(DE).map(([k, v]) => `    '${k}': ${JSON.stringify(v)}`);
const deBlock = '  de: {\n' + lines.join(',\n') + '\n  },\n';

// Trova la chiusura della sezione "fr: { ... }" all'interno di "var I18N = { ... };"
// e inserisce "de:" subito dopo, prima della chiusura finale "};"
const insertRe = /(  fr: \{[\s\S]*?\n  \}\n)(\};)/;
const match = html.match(insertRe);

if (!match) {
  console.error('[ERROR] Punto di inserimento (dopo sezione fr: del dizionario locale) non trovato.');
  process.exit(1);
}

html = html.replace(insertRe, (m, frBlock, closing) => {
  // Aggiunge la virgola dopo la chiusura di fr se non già presente
  const frBlockWithComma = frBlock.replace(/\}\n$/, '},\n');
  return frBlockWithComma + deBlock + closing;
});

console.log('[OK] Sezione "de:" inserita nel dizionario locale I18N di index.html (' + Object.keys(DE).length + ' chiavi).');

writeCRLF(FILE, html);

const check = (html.match(/\n  de: \{/g) || []).length;
const keyCount = Object.keys(DE).length;
console.log(`[STAT] Sezioni "de:" nel dizionario locale: ${check} (atteso: 1)`);
console.log(`[STAT] Chiavi tedesche inserite: ${keyCount}`);
console.log('[DONE] File salvato con CRLF.');
