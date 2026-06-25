#!/usr/bin/env node
// patch-chat-frasi-rapide.js
// Aggiunge frasi rapide multilingua a chat.html:
// - barra di bottoni sopra l'input con 6 frasi comuni
// - ogni frase ha una chiave salvata in Firestore (quickPhrase)
// - chi legge vede sempre la frase nella propria lingua (no traduzione AI,
//   solo dizionario locale — zero costi, zero latenza)

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'public', 'chat.html');

function readNorm(f) {
  return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
}
function writeCRLF(f, content) {
  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
}
function backup(f) {
  fs.copyFileSync(f, f + '.preFrasiRapide.bak');
  console.log('[BAK] ' + f + '.preFrasiRapide.bak');
}

// Dizionario frasi rapide × 6 lingue (it/en/zh/es/fr/de)
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
  console.log('[SKIP] Frasi rapide già presenti in chat.html.');
  process.exit(0);
}

// ── 1. CSS per la barra frasi rapide ──
const cssBlock = `
/* QUICK PHRASES */
.quick-phrases{display:flex;gap:6px;padding:10px 16px 0;overflow-x:auto;scrollbar-width:none;}
.quick-phrases::-webkit-scrollbar{display:none;}
.quick-phrase-btn{flex-shrink:0;background:rgba(200,134,10,.1);border:1px solid rgba(200,134,10,.3);color:var(--ocra-l);font-size:12px;padding:7px 12px;border-radius:16px;cursor:pointer;white-space:nowrap;font-family:'DM Sans',sans-serif;transition:background .2s;}
.quick-phrase-btn:hover{background:rgba(200,134,10,.2);}
.msg-translated-note{font-size:9px;opacity:.5;margin-top:2px;font-style:italic;}
`;
html = html.replace(/(<\/style>)/, cssBlock + '$1');
console.log('[OK] CSS frasi rapide aggiunto.');

// ── 2. HTML: barra bottoni sopra l'input ──
const quickBarHtml = `  <div class="quick-phrases" id="quick-phrases"></div>
`;
html = html.replace(
  /(<div class="chat-input-bar">)/,
  quickBarHtml + '$1'
);
console.log('[OK] Barra frasi rapide HTML aggiunta.');

// ── 3. JS: dizionario + render bottoni + funzione invio frase + traduzione in lettura ──
const jsBlock = `
// ══════════════════════════════════
// FRASI RAPIDE MULTILINGUA
// ══════════════════════════════════
const QUICK_PHRASES = ${JSON.stringify(QUICK_PHRASES, null, 2)};

function getCurrentLang() {
  return localStorage.getItem('it_lang') || 'it';
}

function renderQuickPhrases() {
  const lang = getCurrentLang();
  const container = document.getElementById('quick-phrases');
  if (!container) return;
  container.innerHTML = Object.entries(QUICK_PHRASES).map(([key, translations]) => {
    const label = translations[lang] || translations.it;
    return \`<button class="quick-phrase-btn" onclick="inviaFraseRapida('\${key}')">\${label}</button>\`;
  }).join('');
}

window.inviaFraseRapida = async function(key) {
  if (!currentTX) return;
  const lang = getCurrentLang();
  const testo = QUICK_PHRASES[key][lang] || QUICK_PHRASES[key].it;
  try {
    await addDoc(collection(db, 'chats', currentTX, 'messages'), {
      testo, da: 'cliente', quickPhrase: key, ts: serverTimestamp()
    });
    const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    await setDoc(doc(db, 'chats', currentTX), {
      negozio: document.getElementById('info-negozio').textContent,
      ultimoMsg: testo,
      ultimoTs: serverTimestamp(),
      daLeggere: true
    }, { merge: true });
  } catch(e) {
    console.error(e);
  }
};

// Traduce un messaggio per la visualizzazione, se ha una quickPhrase key
// e l'utente corrente legge in una lingua diversa da quella in cui è stato scritto.
function testoVisualizzato(d) {
  if (d.quickPhrase && QUICK_PHRASES[d.quickPhrase]) {
    const lang = getCurrentLang();
    return QUICK_PHRASES[d.quickPhrase][lang] || QUICK_PHRASES[d.quickPhrase].it;
  }
  return d.testo;
}
`;

// Inserisce il blocco JS subito dopo la creazione di "let currentTX = null;"
html = html.replace(
  /(let currentTX = null;\nlet unsubscribe = null;\n)/,
  '$1' + jsBlock
);
console.log('[OK] Logica JS frasi rapide inserita.');

// ── 4. Modifica ascoltaMessaggi() per usare testoVisualizzato() invece di d.testo ──
html = html.replace(
  /div\.innerHTML = `<div>\$\{d\.testo\}<\/div>\$\{ora \? `<div class="msg-time">\$\{ora\}<\/div>` : ''\}`;/,
  'div.innerHTML = `<div>${testoVisualizzato(d)}</div>${d.quickPhrase ? `<div class="msg-translated-note">⚡ frase rapida</div>` : \'\'}${ora ? `<div class="msg-time">${ora}</div>` : \'\'}`;'
);
console.log('[OK] Rendering messaggi aggiornato per usare testoVisualizzato().');

// ── 5. Chiama renderQuickPhrases() all'avvio e dopo il login ──
html = html.replace(
  /(document\.getElementById\('chat-screen'\)\.style\.display = 'flex';)/,
  '$1\n    renderQuickPhrases();'
);
console.log('[OK] renderQuickPhrases() chiamata dopo login.');

writeCRLF(FILE, html);

const check1 = (html.match(/QUICK_PHRASES/g) || []).length;
const check2 = (html.match(/inviaFraseRapida/g) || []).length;
console.log('[STAT] Occorrenze QUICK_PHRASES: ' + check1);
console.log('[STAT] Occorrenze inviaFraseRapida: ' + check2);
console.log('[DONE] File salvato con CRLF.');
