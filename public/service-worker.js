// Service Worker Installation
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installiert');
  self.skipWaiting();
});

// Service Worker Aktivierung
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Aktiviert');
  return self.clients.claim();
});

// Push-Event Handler
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push-Event empfangen:', event);
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Service Worker] Push-Daten:', data);
      
      const options = {
        body: data.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [100, 50, 100],
        data: {
          url: '/#/chat' // URL zum Chat-Tab
        },
        requireInteraction: true, // Notification bleibt sichtbar bis Benutzer interagiert
        actions: [
          {
            action: 'open',
            title: 'Öffnen'
          },
          {
            action: 'close',
            title: 'Schließen'
          }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (error) {
      console.error('[Service Worker] Fehler beim Verarbeiten der Push-Nachricht:', error);
    }
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification wurde geklickt:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      // Wenn ein Fenster bereits geöffnet ist, fokussiere es
      for (let client of clientList) {
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sonst öffne ein neues Fenster
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
}); 