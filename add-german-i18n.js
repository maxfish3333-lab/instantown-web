#!/usr/bin/env node
// add-german-i18n.js
// Aggiunge la sezione "de:" (tedesco) come 6a lingua al dizionario IT18N
// in i18n.js, copiando esattamente la struttura/ordine delle chiavi
// esistenti (it/en/zh/es/fr) e traducendo in tedesco.
// Aggiorna anche rilevaLingua() per riconoscere 'de'.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'i18n.js');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preGerman.bak');
  console.log('[BAK] ' + f + '.preGerman.bak');
}

// Dizionario tedesco completo, stesso ordine delle chiavi italiane
const DE = {
  // NAV
  back: '←',
  register: 'Als Geschäft registrieren →',
  myqr: '🎫 Meine QRs',
  // HOME
  kicker: 'Rom — Pilotstadt 2025',
  title: 'Die Welt<br><em>zu deinen Füßen.</em>',
  desc: 'Blitzangebote im Umkreis von 200 Metern, öffentliche Dienste auf der Karte, garantierte Zahlungen. INSTANTOWN verbindet Bürger, Touristen und Geschäfte in Echtzeit.',
  btn1: 'Wesentliche Dienste',
  sub1: 'Trinkbrunnen · Toiletten · Wi-Fi<br>Ikonische Orte Roms',
  btn2: 'Blitzangebote',
  sub2: 'Essen · Mode · Tech · Reisen<br>Unterhaltung · Sonstiges',
  b1t: 'Echte Nähe, keine Werbung',
  b1d: 'Das GPS berechnet, was sich um dich befindet — innerhalb von 200, 300 oder 500 Metern. Du siehst nur Angebote von physischen Geschäften, die du zu Fuß erreichen kannst.',
  b2t: 'Zahlung mit Bankgarantie, fester Preis',
  b2d: 'Das Geld bleibt eingefroren bis zum physischen Treffen von QR-A und QR-B. Der angezeigte Preis ist der Preis, den du zahlst — unveränderlich.',
  b3t: 'Integrierte öffentliche Dienste',
  b3d: 'Trinkbrunnen, öffentliche Toiletten, kostenloses Wi-Fi — alles auf derselben Karte. Roms Sehenswürdigkeiten immer nur einen Klick entfernt.',
  b4t: 'Betrugssicher by Design',
  b4d: 'Jedes Geschäft wird mit echter Steuernummer verifiziert. Der doppelte physische QR-Code macht Betrug unmöglich.',
  // RADAR
  radarTitle: '⚡ PROX Radar',
  gpsLoading: 'GPS-Position wird ermittelt...',
  gpsActive: 'GPS aktiv',
  gpsDefault: 'Rom (Standard)',
  all: 'Alle',
  food: 'Essen',
  fashion: 'Mode',
  travel: 'Reisen',
  fun: 'Spaß',
  other: 'Sonstiges',
  offer: 'Angebot',
  offers: 'Angebote',
  inRadius: 'im Umkreis',
  distFrom: 'von dir',
  book: 'BUCHEN & BEZAHLEN',
  goThere: 'BRING MICH HIN',
  escrow: '🔐 Gelder unter Bankgarantie bis zum physischen Treffen',
  timeNA: 'Uhrzeit nicht angegeben',
  ck_back_map: '← Zurück zur Karte',
  ck_titolo: 'Zahlung mit Bankgarantie',
  ck_fondi_info: 'Die Gelder werden zurückgehalten und erst beim physischen Treffen freigegeben.',
  ck_totale_label: 'Zu sperrender Betrag',
  ck_oggetto: 'Artikel',
  ck_label_carta: 'Kartennummer',
  ck_label_scadenza: 'Ablaufdatum',
  ck_label_cvv: 'CVV',
  ck_btn_paga: 'AUTORISIEREN UND SPERREN',
  ck_secure_badge: 'SSL-VERSCHLÜSSELUNG AKTIV - INSTANTOWN PAY',
  qrTitle: 'QR-B Kunde',
  qrSub: 'Zeige dies dem Geschäft, um die Gelder freizugeben',
  qrNote: '✓ Das Geschäft scannt diesen QR-Code. Nur das passende Paar gibt die Gelder frei.',
  qrClose: 'Verstanden — zum Geschäft gehen',
  // OFFERTE
  offerteTitle: 'Blitzangebote',
  liveUpdate: 'Live-Aktualisierung',
  filterAll: 'Alle',
  filterActive: 'Nur aktive',
  filterExpired: 'Abgelaufen',
  radius: 'Radius',
  totalOffers: 'Angebote insgesamt',
  activeNow: 'Jetzt aktiv',
  avgSaving: 'Durchschn. Ersparnis',
  toVerify: 'Zu prüfen',
  bookBtn: 'Buchen →',
  adminReview: 'Admin-Prüfung',
  prefActive: 'Aktive Präferenzen',
  modify: 'Bearbeiten',
  noOffers: 'Keine Angebote für diese Auswahl.',
  // RG (registrazione.html)
  rg_title: 'InstantTown — Registrierung',
  rg_h1: 'Registrierung',
  rg_sub: 'Wähle dein Profil, um zu beginnen',
  rg_btn_priv_label: 'Privatperson',
  rg_btn_priv_sub: 'Bürger oder Tourist',
  rg_btn_imp_label: 'Unternehmen / Geschäft',
  rg_btn_imp_sub: 'Geschäft oder Tätigkeit',
  rg_info_priv: 'Schnelle Registrierung — du brauchst nur deine <strong>E-Mail</strong>.<br>Weitere Daten erfassen wir sicher von deiner Zahlungskarte beim ersten Einkauf.',
  rg_label_email_priv: 'Deine E-Mail',
  rg_ph_email_priv: 'deine@email.com',
  rg_check_priv: 'Ich akzeptiere die Nutzungsbedingungen und das Bankgarantie-Zahlungssystem',
  rg_btn_send_priv: 'Senden — Bestätigungslink erhalten',
  rg_note_priv: 'Du erhältst eine E-Mail mit dem Link zur Aktivierung deines Kontos.',
  rg_info_imp: 'Gib die Daten deines Unternehmens ein. Wir verifizieren <strong>Steuernummer</strong> und <strong>USt-IdNr.</strong> in Echtzeit vor dem Absenden.',
  rg_success_title: 'Registrierung abgeschlossen!',
  rg_success_body: '📧 <strong>Prüfe deine E-Mail</strong> — du erhältst deine <strong>persönliche PIN</strong> von <em>info@instantown.it</em> innerhalb wenige Minuten.',
  rg_success_note: 'Die PIN wird benötigt, um Angebote zu veröffentlichen und auf den Geschäftsbereich zuzugreifen.',
  rg_label_insegna: 'Geschäftsname',
  rg_ph_insegna: 'Z.B. Bäckerei Rossi',
  rg_label_denom: 'Firmenname',
  rg_ph_denom: 'Z.B. Rossi Mario S.n.c.',
  rg_label_cat: 'Geschäftskategorie',
  rg_opt_default: '— Hauptkategorie auswählen —',
  rg_opt_cibo: '🍕 Essen — Lebensmittel, Restaurants, Bars, Gastronomie',
  rg_opt_moda: '👗 Mode — Kleidung, Schuhe, Accessoires',
  rg_opt_tech: '📱 Tech — Elektronik, IT, Telefonie',
  rg_opt_viaggi: '✈️ Reisen — Tourismus, Erlebnisse, Transport',
  rg_opt_divert: '🎭 Unterhaltung — Shows, Events, Sport, Kultur',
  rg_opt_altro: '🛍️ Sonstiges — Dienstleistungen, Handwerk, andere Kategorien',
  rg_div_fiscale: 'Steuerdaten',
  rg_label_cf: 'Steuernummer',
  rg_label_piva: 'USt-IdNr.',
  rg_div_sede: 'Adresse',
  rg_label_via: 'Straße / Platz',
  rg_ph_via: 'Via Roma',
  rg_label_civico: 'Nr.',
  rg_label_citta: 'Stadt',
  rg_ph_citta: 'Rom',
  rg_div_contatti: 'Kontakte',
  rg_label_email_imp: 'E-Mail',
  rg_ph_email_imp: 'info@geschaeft.de',
  rg_label_tel: 'Telefon',
  rg_ph_tel: '+39 06 123456',
  rg_check_imp: 'Ich erkläre, dass die eingegebenen Daten wahrheitsgemäß sind, und akzeptiere die InstantTown-Nutzungsbedingungen',
  rg_btn_send_imp: 'Aktivierungsantrag senden',
  rg_note_attivazione: 'Dein Geschäftsbereich wird innerhalb von 24 Stunden nach Überprüfung der Steuerdaten aktiviert.',
  rg_msg_cf_corp: '✓ Firmensteuernummer gültig',
  rg_msg_cf_fmt: '✗ Ungültiges Format — 16 Zeichen (Privatperson) oder 11 Ziffern (Unternehmen)',
  rg_msg_cf_check: '✗ Steuernummer ungültig (Prüfziffer falsch)',
  rg_msg_cf_ok: '✓ Steuernummer formal gültig',
  rg_msg_piva_len: '✗ Die USt-IdNr. muss aus 11 Ziffern bestehen',
  rg_msg_piva_check: '✗ USt-IdNr. ungültig (Prüfziffer falsch)',
  rg_msg_piva_ufficio: '✗ Ungültiger USt-Amtscode',
  rg_msg_piva_ok: '✓ USt-IdNr. formal gültig',
  rg_alert_form: 'Korrigiere die hervorgehobenen Steuerdaten, bevor du fortfährst.',
  rg_invio: 'Wird gesendet…',
  rg_alert_invio_err: 'Sendefehler. Bitte versuche es in einigen Sekunden erneut.',
  rg_alert_net_err: 'Netzwerkfehler. Überprüfe deine Verbindung und versuche es erneut.',
  // MA (mio-account.html)
  ma_nav_radar: 'Radar →',
  ma_pin_label: 'Deine persönliche INSTANTOWN-PIN',
  ma_pin_note: 'Diese PIN identifiziert dein Konto. Teile sie dem Geschäft zusammen mit dem QR-B mit, um den Abgleich abzuschließen und die Gelder der Bankgarantie freizugeben.',
  ma_pin_copy: '📋 PIN kopieren',
  ma_pin_copied: '✓ Kopiert!',
  ma_section_title: 'Meine QR-Bs',
  ma_empty_text: 'Du hast noch keine QR-Bs gespeichert.<br>Buche ein Angebot über den Radar, um deinen ersten QR-Code zu erstellen.',
  ma_empty_cta: 'Radar öffnen →',
  ma_btn_mostra: '🔍 Großen QR-Code zeigen',
  ma_btn_elimina: 'Löschen',
  ma_stato_completato: '✓ Abgeschlossen',
  ma_stato_scaduto: 'Abgelaufen',
  ma_stato_attesa: '⏳ Ausstehend',
  ma_modal_title: 'QR-B — Dem Geschäft zeigen',
  ma_modal_pin: 'Deine PIN:',
  ma_modal_istr: '✓ Das Geschäft zeigt QR-A — lass es an seinem Terminal scannen.<br>Nur das Paar QR-A + QR-B gibt die Gelder frei.',
  ma_modal_close: 'Schließen',
  ma_confirm_elimina: 'Diesen QR-B löschen? Du kannst ihn nicht mehr für den Abgleich verwenden.',
};

backup(FILE);
let content = readNorm(FILE);

if (content.includes('\n  de: {')) {
  console.log('[SKIP] La sezione "de:" esiste già nel file.');
  process.exit(0);
}

// Costruisci il blocco de: { ... } con le chiavi nello stesso ordine del dizionario
const lines = Object.entries(DE).map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`);
const deBlock = '  de: {\n' + lines.join(',\n') + '\n  },\n';

// Inserisci il blocco "de:" subito dopo la chiusura della sezione "fr:"
// che è seguita da "};" di chiusura dell'oggetto IT18N
const insertRe = /(\n  fr: \{[\s\S]*?\n  \},\n)(\};)/;
if (!insertRe.test(content)) {
  console.error('[ERROR] Non trovo il punto di inserimento dopo la sezione fr:. Verifica manualmente.');
  process.exit(1);
}
content = content.replace(insertRe, (match, frBlock, closing) => frBlock + deBlock + closing);
console.log('[OK] Sezione "de:" inserita dopo "fr:" con ' + Object.keys(DE).length + ' chiavi.');

// Aggiorna rilevaLingua() per riconoscere 'de'
const detectRe = /(if\(sys\.startsWith\('fr'\)\) return 'fr';)/;
if (detectRe.test(content)) {
  content = content.replace(detectRe, "$1\n  if(sys.startsWith('de')) return 'de';");
  console.log('[OK] rilevaLingua() aggiornata per riconoscere "de".');
} else {
  console.log('[WARN] Pattern rilevaLingua() per fr non trovato — verificare manualmente se de è stato aggiunto al rilevamento automatico.');
}

writeCRLF(FILE, content);

const finalCheck = (content.match(/\n  de: \{/g) || []).length;
const deKeysCount = (content.match(/^\s{4}\w+:/gm) || []).length;
console.log(`[STAT] Sezioni "de:" nel file finale: ${finalCheck} (atteso: 1)`);
console.log(`[STAT] Chiavi tedesche inserite: ${Object.keys(DE).length}`);
console.log('[DONE] File salvato con CRLF.');
