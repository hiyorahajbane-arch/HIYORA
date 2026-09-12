import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

const SEED = [
  { name: 'هاتف ذكي نوفا X', price: 1299, category: 'إلكترونيات', description: 'هاتف ذكي بشاشة 6.7 بوصة وكاميرا 108MP وبطارية 5000mAh.', image: 'https://picsum.photos/seed/phone/600/600', stock: 25 },
  { name: 'لابتوب برو 15', price: 3499, category: 'إلكترونيات', description: 'لابتوب بشاشة 15.6 بوصة ومعالج حديث وبطارية تدوم 12 ساعة.', image: 'https://picsum.photos/seed/laptop/600/600', stock: 8 },
  { name: 'سماعات لاسلكية زين', price: 199, category: 'إلكترونيات', description: 'سماعات تعزل الضجيج ببطارية 30 ساعة وبلوتوث 5.3.', image: 'https://picsum.photos/seed/headset/600/600', stock: 40 },
  { name: 'ساعة ذكية فيت مين', price: 449, category: 'إلكترونيات', description: 'ساعة ذكية تقيس نبضات القلب والنوم والتمارين الرياضية.', image: 'https://picsum.photos/seed/watch/600/600', stock: 30 },
  { name: 'قميص قطني أساسي', price: 89, category: 'ملابس', description: 'قميص قطني مريح متوفر بألوان متعددة.', image: 'https://picsum.photos/seed/tshirt/600/600', stock: 60 },
  { name: 'حذاء رياضي لايت', price: 249, category: 'ملابس', description: 'حذاء رياضي خفيف ومريح للجري والمشي اليومي.', image: 'https://picsum.photos/seed/shoes/600/600', stock: 20 },
  { name: 'حقيبة ظهر أنيقة', price: 149, category: 'إكسسوارات', description: 'حقيبة ظهر مقاومة للماء بمساحة لللابتوب حتى 15.6 بوصة.', image: 'https://picsum.photos/seed/backpack/600/600', stock: 35 },
  { name: 'نظارة شمسية كلاسيك', price: 119, category: 'إكسسوارات', description: 'نظارة شمسية بحماية UV400 وإطار متين.', image: 'https://picsum.photos/seed/sunglasses/600/600', stock: 50 }
];

const g = globalThis;
if (!g.__soukDb) {
  g.__soukDb = {
    products: SEED.map(p => ({ id: randomUUID(), createdAt: new Date().toISOString(), ...p })),
    orders: []
  };
}
const db = g.__soukDb;
const getDb = () => db;
const updateDb = (fn) => { const r = fn(db); return r === undefined ? db : r; };

function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'غير مصرح' });
  try { req.admin = jwt.verify(t, JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'الجلسة انتهت، سجل الدخول مجدداً' }); }
}

app.get('/api', (req, res) => res.json({ name: 'سوق - واجهة برمجية للمتجر', version: '1.0.0' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
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
  const d = getDb();
  const revenue = d.orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  res.json({ productCount: d.products.length, orderCount: d.orders.length, pendingCount: d.orders.filter(o => o.status === 'pending').length, revenue });
});
app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const category = (req.query.category || '').toString().trim();
  let products = getDb().products;
  if (category) products = products.filter(p => p.category === category);
  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.includes(q));
  res.json(products);
});
app.get('/api/products/categories', (req, res) => {
  const cats = [...new Set(getDb().products.map(p => p.category).filter(Boolean))];
  res.json(cats);
});
app.post('/api/products', requireAdmin, (req, res) => {
  const { name, price, category, description, image, stock } = req.body || {};
  if (!name || typeof price !== 'number' || price < 0) return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  const product = { id: randomUUID(), name: String(name), price, category: category || '', description: description || '', image: image || '', stock: Number.isFinite(stock) ? stock : 0, createdAt: new Date().toISOString() };
  updateDb(d => { d.products.unshift(product); return product; });
  res.status(201).json(product);
});
app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const r = updateDb(d => {
    const i = d.products.findIndex(p => p.id === id);
    if (i === -1) return null;
    d.products[i] = { ...d.products[i], ...req.body, id };
    return d.products[i];
  });
  if (!r) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(r);
});
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const r = updateDb(d => {
    const b = d.products.length;
    d.products = d.products.filter(p => p.id !== id);
    return d.products.length !== b;
  });
  if (!r) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json({ ok: true });
});
app.post('/api/orders', (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer || !customer.name || !customer.phone) return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'السلة فارغة' });
  const d = getDb();
  const orderItems = [];
  for (const item of items) {
    const p = d.products.find(x => x.id === item.id);
    if (!p) return res.status(400).json({ error: `منتج غير موجود: ${item.name}` });
    const qty = Math.max(1, Math.min(Number(item.qty) || 1, p.stock > 0 ? p.stock : 99999));
    orderItems.push({ productId: p.id, name: p.name, price: p.price, qty });
  }
  const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const order = { id: randomUUID().slice(0, 8).toUpperCase(), customer: { name: String(customer.name), phone: String(customer.phone), address: customer.address || '', city: customer.city || '', notes: customer.notes || '' }, items: orderItems, total, status: 'pending', createdAt: new Date().toISOString() };
  updateDb(db2 => {
    db2.orders.unshift(order);
    for (const it of orderItems) { const p = db2.products.find(x => x.id === it.productId); if (p && p.stock > 0) p.stock = Math.max(0, p.stock - it.qty); }
  });
  res.status(201).json(order);
});
app.get('/api/orders', requireAdmin, (req, res) => {
  const d = getDb();
  const s = (req.query.status || '').toString();
  res.json(s ? d.orders.filter(o => o.status === s) : d.orders);
});
app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
  const r = updateDb(d => {
    const o = d.orders.find(x => x.id === id);
    if (!o) return null;
    o.status = status;
    if (status === 'cancelled') for (const it of o.items) { const p = d.products.find(x => x.id === it.productId); if (p) p.stock += it.qty; }
    return o;
  });
  if (!r) return res.status(404).json({ error: 'الطلب غير موجود' });
  res.json(r);
});

export default app;