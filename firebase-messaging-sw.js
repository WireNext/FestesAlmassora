// Importa las librerías necesarias mediante importScripts (forma compatible)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Tu configuración (la que has pegado antes)
const firebaseConfig = {
  apiKey: "AIzaSyCBRrz5GzVQ-eSGKyoiy-2DWoVU9msxPwA",
  authDomain: "alertes-festes.firebaseapp.com",
  projectId: "alertes-festes",
  storageBucket: "alertes-festes.firebasestorage.app",
  messagingSenderId: "560447529511",
  appId: "1:560447529511:web:500e93ab4a1434a3e1e402",
  measurementId: "G-W5MV8950LK"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Inicializa Firebase Messaging
const messaging = firebase.messaging();

// Este evento maneja las notificaciones cuando la app está CERRADA o en SEGUNDO PLANO
messaging.onBackgroundMessage((payload) => {
  console.log('Notificació rebuda en segon pla:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'icon-512.png', // Asegúrate de que esta ruta sea correcta
    badge: 'icon-512.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Tu evento fetch vacío (necesario para que sea PWA instalable)
self.addEventListener('fetch', function(event) {
    const urlToOpen = 'https://festesalmassora.vercel.app/';
});