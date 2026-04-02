// Importa las librerías necesarias mediante importScripts (forma compatible)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCBRrz5GzVQ-eSGKyoiy-2DWoVU9msxPwA",
  authDomain: "alertes-festes.firebaseapp.com",
  projectId: "alertes-festes",
  storageBucket: "alertes-festes.firebasestorage.app",
  messagingSenderId: "560447529511",
  appId: "1:560447529511:web:500e93ab4a1434a3e1e402",
  measurementId: "G-W5MV8950LK"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 1. Manejo en segundo plano
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'icon-512.png',
    badge: 'icon-512.png',
    // Guardamos la URL en los datos de la notificación por si queremos que sea dinámica
    data: {
      url: 'https://festesalmassora.vercel.app/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. LOGICA PARA ABRIR LA WEB AL HACER CLIC
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cierra la notificación al pinchar

  const urlToOpen = 'https://festesalmassora.vercel.app/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(windowClients) {
        // Si la web ya está abierta en alguna pestaña, le ponemos el foco
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no está abierta, abrimos una nueva pestaña
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Evento fetch (puedes dejarlo vacío o implementarlo para caché, pero no afecta al clic)
self.addEventListener('fetch', function(event) {
    // Aquí iría la lógica de caché de la PWA si la necesitas
});