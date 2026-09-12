import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { updateDb, getDb } from '../lib/db.js';
import { requireAdmin } from './auth.js';

const router = Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const category = (req.query.category || '').toString().trim();
  const db = getDb();
  let products = db.products;
  if (category) products = products.filter((p) => p.category === category);
  if (q) products = products.filter((p) => p.name.toLowerCase().includes(q) || p.description.includes(q));
  res.json(products);
});

router.get('/categories', (req, res) => {
  const db = getDb();
  const categories = [...new Set(db.products.map((p) => p.category).filter(Boolean))];
  res.json(categories);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, price, category, description, image, stock } = req.body || {};
  if (!name || typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  }
  const product = {
    id: randomUUID(),
    name: String(name),
    price,
    category: category || '',
    description: description || '',
    image: image || '',
    stock: Number.isFinite(stock) ? stock : 0,
    createdAt: new Date().toISOString()
  };
  const saved = updateDb((db) => {
    db.products.unshift(product);
    return product;
  });
  res.status(201).json(saved);
});

router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = updateDb((db) => {
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    db.products[idx] = { ...db.products[idx], ...req.body, id };
    return db.products[idx];
  });
  if (!result) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(result);
});

router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = updateDb((db) => {
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    return db.products.length !== before;
  });
  if (!result) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json({ ok: true });
});

export default router;