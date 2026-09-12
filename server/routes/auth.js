import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../lib/db.js';

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-change-me';

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, username });
  }
  return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
});

export function requireAdmin(req, res, next) {
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

router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username });
});

router.get('/stats', (req, res) => {
  const db = getDb();
  const revenue = db.orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);
  res.json({
    productCount: db.products.length,
    orderCount: db.orders.length,
    pendingCount: db.orders.filter((o) => o.status === 'pending').length,
    revenue
  });
});

export default router;