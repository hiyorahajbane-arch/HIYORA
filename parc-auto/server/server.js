import express from 'express';
import cors from 'cors';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import parcRouter from './routes/parc-standalone.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => res.json({ name: 'Parc Auto - HAJBANE - Direction Publique', version: '1.0.0 - HAJBANE' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/parc', parcRouter);

// Serve frontend if built
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');
app.use(express.static(CLIENT_DIST));
app.get('*', (req, res) => {
  try { res.sendFile(join(CLIENT_DIST, 'index.html')); } catch { res.json({ ok: true, message: 'API Parc Auto standalone - frontend not built yet' }); }
});

app.listen(PORT, () => {
  console.log(`[PARC-AUTO] ✅ Serveur indépendant sur http://localhost:${PORT}`);
  console.log(`[PARC-AUTO] API: http://localhost:${PORT}/api/parc`);
});
