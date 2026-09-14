import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import { getDb } from './lib/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ name: 'HIYORA - واجهة برمجية للمتجر', version: '1.0.0' });
});
app.get('/api/health', (req, res) => res.json({ ok: true, vercel: !!process.env.VERCEL }));

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

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