// ── FIREBASE MESSAGING SERVICE WORKER ──
// Gestisce le notifiche push in arrivo quando la pagina INSTANTOWN non è
// in primo piano (scheda in background, o su Android anche browser chiuso;
// su iPhone funziona solo se l'app è stata aggiunta alla schermata Home).
// File separato da sw.js (quello della cache offline) per non mescolare
// le due responsabilità — è il pattern standard raccomandato da Firebase.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// ⚠️ SOSTITUIRE con i valori reali da Firebase Console →
// Impostazioni progetto → Generale → Le tue app → firebaseConfig
firebase.initializeApp({
  apiKey: "AIzaSyBez4L85HA1__NPKOzagfmKeoGLniIQeAc",
  authDomain: "instantown-app.firebaseapp.com",
  projectId: "instantown-app",
  storageBucket: "instantown-app.firebasestorage.app",
  messagingSenderId: "469598782572",
  appId: "1:469598782572:web:7f17ab0b6c1ee983d68449"
});

const messaging = firebase.messaging();

// Gestisce la notifica quando arriva e la pagina non è in primo piano.
// Il campo "image" (foto grande) viene mostrato automaticamente da Chrome/
// Android; su alcuni browser/iOS potrebbe non comparire, solo testo+icona.
messaging.onBackgroundMessage((payload) => {
  const titolo = payload.notification?.title || 'INSTANTOWN';
  const opzioni = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    image: payload.notification?.image || undefined,
    badge: '/icon-192.png',
    tag: 'instantown-broadcast',
    data: { click_action: payload.data?.click_action || 'https://instantown.it/offerte.html' }
  };
  self.registration.showNotification(titolo, opzioni);
});

// Al tap sulla notifica, apre (o porta in primo piano) la pagina offerte
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.click_action || 'https://instantown.it/offerte.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
