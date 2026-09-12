import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { getDb, updateDb } from '../server/lib/db.js';

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'غير مصرح' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'الجلسة انتهت، سجل الدخول مجدداً' });
  }
}

app.get('/api', (req, res) => res.json({ name: 'سوق - واجهة برمجية للمتجر', version: '1.0.0' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, username });
  }
  return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
});
app.get('/api/auth/me', requireAdmin, (req, res) => res.json({ username: req.admin.username }));
app.get('/api/auth/stats', (req, res) => {
  const db = getDb();
  const revenue = db.orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  res.json({ productCount: db.products.length, orderCount: db.orders.length, pendingCount: db.orders.filter(o => o.status === 'pending').length, revenue });
});

// Products
app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const category = (req.query.category || '').toString().trim();
  const db = getDb();
  let products = db.products;
  if (category) products = products.filter(p => p.category === category);
  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.includes(q));
  res.json(products);
});
app.get('/api/products/categories', (req, res) => {
  const db = getDb();
  const categories = [...new Set(db.products.map(p => p.category).filter(Boolean))];
  res.json(categories);
});
app.post('/api/products', requireAdmin, (req, res) => {
  const { name, price, category, description, image, stock } = req.body || {};
  if (!name || typeof price !== 'number' || price < 0) return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  const product = { id: randomUUID(), name: String(name), price, category: category || '', description: description || '', image: image || '', stock: Number.isFinite(stock) ? stock : 0, createdAt: new Date().toISOString() };
  const saved = updateDb(db => { db.products.unshift(product); return product; });
  res.status(201).json(saved);
});
app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = updateDb(db => {
    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.products[idx] = { ...db.products[idx], ...req.body, id };
    return db.products[idx];
  });
  if (!result) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(result);
});
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = updateDb(db => {
    const before = db.products.length;
    db.products = db.products.filter(p => p.id !== id);
    return db.products.length !== before;
  });
  if (!result) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json({ ok: true });
});

// Orders
app.post('/api/orders', (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer || !customer.name || !customer.phone) return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'السلة فارغة' });
  const db = getDb();
  const orderItems = [];
  for (const item of items) {
    const product = db.products.find(p => p.id === item.id);
    if (!product) return res.status(400).json({ error: `منتج غير موجود: ${item.name}` });
    const qty = Math.max(1, Math.min(Number(item.qty) || 1, product.stock > 0 ? product.stock : 99999));
    orderItems.push({ productId: product.id, name: product.name, price: product.price, qty });
  }
  const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order = { id: randomUUID().slice(0, 8).toUpperCase(), customer: { name: String(customer.name), phone: String(customer.phone), address: customer.address || '', city: customer.city || '', notes: customer.notes || '' }, items: orderItems, total, status: 'pending', createdAt: new Date().toISOString() };
  updateDb(d => {
    d.orders.unshift(order);
    for (const item of orderItems) { const p = d.products.find(x => x.id === item.productId); if (p && p.stock > 0) p.stock = Math.max(0, p.stock - item.qty); }
  });
  res.status(201).json(order);
});
app.get('/api/orders', requireAdmin, (req, res) => {
  const db = getDb();
  const status = (req.query.status || '').toString();
  const orders = status ? db.orders.filter(o => o.status === status) : db.orders;
  res.json(orders);
});
app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
  const result = updateDb(db => {
    const order = db.orders.find(o => o.id === id);
    if (!order) return null;
    order.status = status;
    if (status === 'cancelled') { for (const item of order.items) { const p = db.products.find(x => x.id === item.productId); if (p) p.stock += item.qty; } }
    return order;
  });
  if (!result) return res.status(404).json({ error: 'الطلب غير موجود' });
  res.json(result);
});

export default app;