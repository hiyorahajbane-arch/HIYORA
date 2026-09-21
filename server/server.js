import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import settingsRouter from './routes/settings.js';
import { getDb } from './lib/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api', (req, res) => {
  res.json({ name: 'HIYORA FASHION - واجهة برمجية للمتجر', version: '1.0.0', whatsapp: process.env.WHATSAPP_NUMBER || '+212675993497' });
});
app.get('/api/health', (req, res) => res.json({ ok: true, vercel: !!process.env.VERCEL }));
app.get('/api/notify/test', async (req, res) => {
  const { notifyOrder } = await import('./lib/notify.js');
  const fake = { id: 'TEST123', customer: { name: 'زبون تجريبي', phone: '0600000000', city: 'الدار البيضاء', address: '-' }, total: 299, items: [{ name: 'منتج تجريبي', qty: 1, price: 299 }] };
  const r = await notifyOrder(fake);
  res.json({ ...r, env: { hasApiKey: !!(process.env.CALLMEBOT_APIKEY || process.env.WHATSAPP_APIKEY), hasWebhook: !!process.env.WHATSAPP_WEBHOOK, phone: process.env.ADMIN_PHONE || 'not-set' } });
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/settings', settingsRouter);

const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res) => {
  res.sendFile(join(CLIENT_DIST, 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    const db = await getDb();
    console.log(`[HIYORA] الخادم يعمل على http://localhost:${PORT}`);
    console.log(`[HIYORA] عدد المنتجات المبدئية: ${db.products.length}`);
  });
}

export default app;