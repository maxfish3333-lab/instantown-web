// ── ISCRIZIONE SILENZIOSA ALLE NOTIFICHE PUSH INSTANTOWN ──
// Al primo caricamento di una pagina che include questo script:
// 1. Registra il service worker Firebase Messaging (se non già attivo)
// 2. Chiede il permesso di notifica al browser (mostra il popup nativo di
//    sistema — quello non si può evitare, è il browser/OS a mostrarlo, non
//    un popup nostro: nessun bottone "Attiva notifiche" nel nostro sito)
// 3. Se il permesso viene concesso, ottiene il "token" del dispositivo e lo
//    salva su Firestore (collezione 'notifiche_iscritti'), per poterlo poi
//    usare per l'invio broadcast dallo script Apps Script
//
// Se il permesso è già stato negato o non ancora deciso, non insiste e non
// mostra nulla di nostro — rispetta la scelta del turista.

// ⚠️ SOSTITUIRE con gli stessi valori usati in firebase-messaging-sw.js
const FIREBASE_CONFIG_NOTIFICHE = {
  apiKey: "AIzaSyBez4L85HA1__NPKOzagfmKeoGLniIQeAc",
  authDomain: "instantown-app.firebaseapp.com",
  projectId: "instantown-app",
  storageBucket: "instantown-app.firebasestorage.app",
  messagingSenderId: "469598782572",
  appId: "1:469598782572:web:7f17ab0b6c1ee983d68449"
};

// ⚠️ SOSTITUIRE con la VAPID key generata in Cloud Messaging → Web Push certificates
const VAPID_KEY_NOTIFICHE = "BLSr4IptwEAkOGoA6voCMXFPwTHeeTzm7z-DSEpiDdl3U3m8bUhFX-ChZFoMgV8A23_k_453hZKDp7iPouyFRc4";

async function iscriviNotifichePush() {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    // Se l'utente ha già negato in passato, non richiediamo di nuovo
    // (il browser stesso blocca il popup ripetuto, questo è solo per
    // evitare lavoro inutile)
    if (Notification.permission === 'denied') return;

    // Evita di ripetere l'iscrizione se già fatta in questa sessione/dispositivo
    if (localStorage.getItem('it_fcm_iscritto') === '1') return;

    const permesso = await Notification.requestPermission();
    if (permesso !== 'granted') return;

    // Import dinamico degli SDK Firebase (solo se serve, non appesantisce
    // le pagine che non arrivano a questo punto)
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');
    const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

    const app = initializeApp(FIREBASE_CONFIG_NOTIFICHE);
    const messaging = getMessaging(app);
    const db = getFirestore(app);

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY_NOTIFICHE,
      serviceWorkerRegistration: registration
    });

    if (token) {
      await setDoc(doc(db, 'notifiche_iscritti', token), {
        token: token,
        lingua: localStorage.getItem('it_lang') || 'it',
        dataIscrizione: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      localStorage.setItem('it_fcm_iscritto', '1');
    }
  } catch (e) {
    // Silenzioso: se qualcosa fallisce (browser non supportato, rete assente,
    // ecc.) non disturbiamo il turista con errori — è una iscrizione
    // opportunistica, non una funzione critica per l'uso dell'app.
    console.log('Iscrizione notifiche non riuscita:', e);
  }
}

iscriviNotifichePush();
