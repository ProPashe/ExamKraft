importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// These will be auto-replaced or can be hardcoded for the demo
// In AI Studio, we can fetch them from the environment if we were building,
// but for a service worker we usually need them available.
// I will use a placeholder or the common config if I can find it.

firebase.initializeApp({
  apiKey: "AIzaSyDySGIvR5MD-8E4cEsCvSKp8FTXoF34ljw",
  authDomain: "tutorconnect-493211.firebaseapp.com",
  projectId: "tutorconnect-493211",
  storageBucket: "tutorconnect-493211.firebasestorage.app",
  messagingSenderId: "241417579218",
  appId: "1:241417579218:web:baaea4c5adadb8413c1b0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
