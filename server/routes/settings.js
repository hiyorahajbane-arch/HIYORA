import { Router } from 'express';
import { getDb, updateDb } from '../lib/db.js';
import { requireAdmin } from './auth.js';

const router = Router();

router.get('/whatsapp', requireAdmin, async (req, res) => {
  const db = await getDb();
  res.json(db.whatsapp || {});
});

router.post('/whatsapp', requireAdmin, async (req, res) => {
  const { phone, apikey, webhook, tgToken, tgChat } = req.body || {};
  await updateDb(db => { db.whatsapp = { phone: phone || '', apikey: apikey || '', webhook: webhook || '', tgToken: tgToken || '', tgChat: tgChat || '' }; });
  res.json({ ok: true });
});

export default router;
