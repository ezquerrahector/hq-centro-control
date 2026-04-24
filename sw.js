// ══════════════════════════════════════════════════════
// HQ Centro de Control — Service Worker v1.0
// Maneja notificaciones push en segundo plano
// ══════════════════════════════════════════════════════

const CACHE_NAME = 'hq-centro-v1';
const APP_URL = 'https://ezquerrahector.github.io/hq-centro-control/';

// Instalación del SW
self.addEventListener('install', event => {
  console.log('[SW] Instalado');
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', event => {
  console.log('[SW] Activado');
  event.waitUntil(clients.claim());
});

// Manejar clic en notificación — abrir la app
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action;
  const url = (event.notification.data && event.notification.data.url) || APP_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si la app ya está abierta, enfocarla
      for(const client of clientList) {
        if(client.url.includes('hq-centro-control') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no está abierta, abrirla
      if(clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Manejar notificaciones push del servidor (para futuro uso con VAPID)
self.addEventListener('push', event => {
  if(!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || '📋 HQ Centro de Control', {
        body:    data.body || '',
        icon:    APP_URL + 'icon.png',
        badge:   APP_URL + 'icon.png',
        tag:     'hq-centro-control',
        vibrate: [200, 100, 200],
        data:    { url: APP_URL },
      })
    );
  } catch(e) {
    console.warn('[SW] Push parse error:', e);
  }
});

// Mensaje desde la app para programar notificación
self.addEventListener('message', event => {
  if(!event.data) return;

  if(event.data.type === 'SCHEDULE_NOTIF') {
    const { title, body, delayMs } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title || '📋 HQ Centro de Control', {
        body:    body || '',
        icon:    APP_URL + 'icon.png',
        tag:     'hq-centro-control',
        vibrate: [200, 100, 200],
        data:    { url: APP_URL },
      });
    }, delayMs || 0);
  }

  if(event.data.type === 'SEND_NOTIF_NOW') {
    const { title, body } = event.data;
    self.registration.showNotification(title || '📋 HQ Centro de Control', {
      body:    body || '',
      icon:    APP_URL + 'icon.png',
      tag:     'hq-centro-control',
      vibrate: [200, 100, 200],
      data:    { url: APP_URL },
    });
  }
});
