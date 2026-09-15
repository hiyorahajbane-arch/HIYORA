self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'HIYORA', body: 'طلب جديد!' };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: '/favicon.ico', badge: '/favicon.ico', vibrate: [200,100,200] }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/admin/orders'));
});
