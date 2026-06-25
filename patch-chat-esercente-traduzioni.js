#!/usr/bin/env node
// patch-chat-esercente-traduzioni.js
// Aggiunge la lettura tradotta delle frasi rapide lato esercente
// (stesso dizionario QUICK_PHRASES usato in chat.html, ma qui non
// serve la barra di invio - solo la traduzione in lettura).

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'chat-esercente.html');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preTraduzioni.bak');
  console.log('[BAK] ' + f + '.preTraduzioni.bak');
}

const QUICK_PHRASES = {
  arriving:  { it:'🚶 Sto arrivando', en:'🚶 I\'m on my way', zh:'🚶 我正在路上', es:'🚶 Ya voy', fr:'🚶 J\'arrive', de:'🚶 Ich bin auf dem Weg' },
  late5:     { it:'⏱️ 5 minuti di ritardo', en:'⏱️ 5 minutes late', zh:'⏱️ 晚到5分钟', es:'⏱️ 5 minutos de retraso', fr:'⏱️ 5 minutes de retard', de:'⏱️ 5 Minuten Verspätung' },
  arrived:   { it:'✅ Sono arrivato/a', en:'✅ I have arrived', zh:'✅ 我已到达', es:'✅ Ya llegué', fr:'✅ Je suis arrivé(e)', de:'✅ Ich bin angekommen' },
  whereExactly: { it:'❓ Dove vi trovo esattamente?', en:'❓ Where exactly can I find you?', zh:'❓ 具体在哪里能找到您？', es:'❓ ¿Dónde os encuentro exactamente?', fr:'❓ Où puis-je vous trouver exactement ?', de:'❓ Wo genau finde ich Sie?' },
  thanksLater: { it:'🙏 Grazie, a dopo', en:'🙏 Thanks, see you soon', zh:'🙏 谢谢，待会见', es:'🙏 Gracias, hasta luego', fr:'🙏 Merci, à bientôt', de:'🙏 Danke, bis gleich' },
  problem:   { it:'⚠️ C\'è un problema', en:'⚠️ There is a problem', zh:'⚠️ 出现了问题', es:'⚠️ Hay un problema', fr:'⚠️ Il y a un problème', de:'⚠️ Es gibt ein Problem' },
};

backup(FILE);
let html = readNorm(FILE);

if (html.includes('QUICK_PHRASES')) {
  console.log('[SKIP] Frasi rapide già presenti in chat-esercente.html.');
  process.exit(0);
}

const jsBlock = `
// ══════════════════════════════════
// LETTURA TRADOTTA FRASI RAPIDE (lato esercente)
// ══════════════════════════════════
const QUICK_PHRASES = ${JSON.stringify(QUICK_PHRASES, null, 2)};

function getCurrentLang() {
  return localStorage.getItem('it_lang') || 'it';
}

function testoVisualizzato(d) {
  if (d.quickPhrase && QUICK_PHRASES[d.quickPhrase]) {
    const lang = getCurrentLang();
    return QUICK_PHRASES[d.quickPhrase][lang] || QUICK_PHRASES[d.quickPhrase].it;
  }
  return d.testo;
}
`;

// Inserisce il blocco JS prima di "window.apriChat = function"
html = html.replace(
  /(window\.apriChat = function)/,
  jsBlock + '\n$1'
);
console.log('[OK] Logica testoVisualizzato() inserita.');

// Aggiorna il rendering messaggi in apriChat() per usare testoVisualizzato()
const before = html;
html = html.replace(
  /div\.innerHTML = `<div>\$\{msg\.testo\}<\/div>\$\{ora \? `<div class="msg-time">\$\{ora\}<\/div>` : ''\}`;/,
  'div.innerHTML = `<div>${testoVisualizzato(msg)}</div>${msg.quickPhrase ? `<div style="font-size:9px;opacity:.5;margin-top:2px;font-style:italic;">⚡ frase rapida</div>` : \'\'}${ora ? `<div class="msg-time">${ora}</div>` : \'\'}`;'
);

if (html === before) {
  console.log('[WARN] Pattern rendering messaggi non trovato — verificare manualmente.');
} else {
  console.log('[OK] Rendering messaggi aggiornato per usare testoVisualizzato().');
}

writeCRLF(FILE, html);

const check1 = (html.match(/QUICK_PHRASES/g) || []).length;
const check2 = (html.match(/testoVisualizzato/g) || []).length;
console.log('[STAT] Occorrenze QUICK_PHRASES: ' + check1);
console.log('[STAT] Occorrenze testoVisualizzato: ' + check2);
console.log('[DONE] File salvato con CRLF.');
