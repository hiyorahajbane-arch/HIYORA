import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { updateDb, getDb } from '../lib/db.js';
import { requireAdmin } from './auth.js';
import { notifyOrder } from '../lib/notify.js';

const router = Router();

router.post('/', async (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer || !customer.name || !customer.phone) {
    return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'السلة فارغة' });
  }

  const db = await getDb();
  const orderItems = [];
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.id);
    if (!product) return res.status(400).json({ error: `منتج غير موجود: ${item.name}` });
    const qty = Math.max(1, Math.min(Number(item.qty) || 1, product.stock > 0 ? product.stock : 99999));
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty,
      size: String(item.size || '')
    });
  }

  const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order = {
    id: randomUUID().slice(0, 8).toUpperCase(),
    customer: {
      name: String(customer.name),
      phone: String(customer.phone),
      address: customer.address || '',
      city: customer.city || '',
      notes: customer.notes || ''
    },
    items: orderItems,
    total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await updateDb((d) => {
    d.orders.unshift(order);
    for (const item of orderItems) {
      const p = d.products.find((x) => x.id === item.productId);
      if (p && p.stock > 0) p.stock = Math.max(0, p.stock - item.qty);
    }
  });

  // إشعار واتساب لا يوقف الرد للزبون
  notifyOrder(order).catch(() => {});

  res.status(201).json(order);
});

router.get('/', requireAdmin, async (req, res) => {
  const db = await getDb();
  const status = (req.query.status || '').toString();
  const orders = status ? db.orders.filter((o) => o.status === status) : db.orders;
  res.json(orders);
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }
  const result = await updateDb((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    if (status === 'cancelled') {
      for (const item of order.items) {
        const p = db.products.find((x) => x.id === item.productId);
        if (p) p.stock += item.qty;
      }
    }
    return order;
  });
  if (!result) return res.status(404).json({ error: 'الطلب غير موجود' });
  res.json(result);
});

export default router;