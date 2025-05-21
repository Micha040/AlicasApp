self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push-Event empfangen:', event);
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        url: '/#/chat' // URL zum Chat-Tab
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Optional: Klick auf Notification
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification wurde geklickt:', event);
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}); 