import { Router } from 'express';
import { getDb, updateDb } from '../lib/db.js';
import { requireAdmin } from './auth.js';

const router = Router();

router.get('/whatsapp', requireAdmin, async (req, res) => {
  const db = await getDb();
  res.json(db.whatsapp || {});
});

router.post('/whatsapp', requireAdmin, async (req, res) => {
  const { phone, apikey, webhook, tgToken, tgChat, ultraInstance, ultraToken } = req.body || {};
  await updateDb(db => { db.whatsapp = { phone: phone || '', apikey: apikey || '', webhook: webhook || '', tgToken: tgToken || '', tgChat: tgChat || '', ultraInstance, ultraToken }; });
  res.json({ ok: true });
});

router.get('/site', async (req, res) => {
  const db = await getDb();
  res.json(db.site || {});
});

router.post('/site', requireAdmin, async (req, res) => {
  const allowed = ['heroHome', 'heroWomen', 'heroMen', 'heroKids', 'promo', 'catWomen', 'catMen', 'catKids'];
  const body = req.body || {};
  await updateDb(db => {
    if (!db.site) db.site = {};
    for (const k of allowed) db.site[k] = typeof body[k] === 'string' ? body[k].slice(0, 2000000) : '';
  });
  res.json({ ok: true });
});

export default router;
