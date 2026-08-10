importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC7n5GyljJKAy0KRcKfUfOU6YJjlZzfsGk",
  authDomain: "visionari-notifications.firebaseapp.com",
  projectId: "visionari-notifications",
  storageBucket: "visionari-notifications.firebasestorage.app",
  messagingSenderId: "1094059898724",
  appId: "1:1094059898724:web:065890acba17510d1a6c71"
});

const messaging = firebase.messaging();

// This runs when a push notification arrives while the app is in the background
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logoVSNR.png' // This uses your custom logo!
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});