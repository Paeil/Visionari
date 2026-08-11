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

// Listen for clicks on the notification
self.addEventListener('notificationclick', (event) => {
    // 1. Close the notification banner immediately after clicking
    event.notification.close();

    // 2. Define the URL to open (Your live Vercel deployment)
    const targetUrl = 'https://visionari-alpha.vercel.app/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // 3. Check if Visionari is already open in a tab. If it is, just focus/switch to it!
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // 4. If the app is completely closed, open a brand new tab to the target URL
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});