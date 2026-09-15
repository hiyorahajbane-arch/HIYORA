import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

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

function makeSeed() {
  return {
    products: SEED.map(p => ({ id: randomUUID(), createdAt: new Date().toISOString(), ...p })),
    orders: []
  };
}

// Mongo support for persistence (Vercel + local)
let mongoClient = null;
let mongoDb = null;
async function getMongoDb() {
  if (!process.env.MONGODB_URI) return null;
  if (mongoDb) return mongoDb;
  const { MongoClient } = await import('mongodb');
  mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();
  mongoDb = mongoClient.db('souk');
  return mongoDb;
}

const g = globalThis;
if (!g.__soukDb && !process.env.MONGODB_URI) {
  g.__soukDb = makeSeed();
}
const memoryDb = g.__soukDb;

async function getDb() {
  if (process.env.MONGODB_URI) {
    const mdb = await getMongoDb();
    const doc = await mdb.collection('store').findOne({ _id: 'main' });
    if (!doc) {
      const seed = makeSeed();
      await mdb.collection('store').insertOne({ _id: 'main', ...seed, whatsapp: {} });
      return { ...seed, whatsapp: {} };
    }
    return { products: doc.products || [], orders: doc.orders || [], whatsapp: doc.whatsapp || {}, pushSubs: doc.pushSubs || [] };
  }
  if (!memoryDb.pushSubs) memoryDb.pushSubs = [];
  return memoryDb;
}

async function updateDb(fn) {
  if (process.env.MONGODB_URI) {
    const mdb = await getMongoDb();
    const doc = await mdb.collection('store').findOne({ _id: 'main' });
    const db = doc ? { products: doc.products || [], orders: doc.orders || [], whatsapp: doc.whatsapp || {}, pushSubs: doc.pushSubs || [] } : { ...makeSeed(), whatsapp: {}, pushSubs: [] };
    if (!doc) await mdb.collection('store').insertOne({ _id: 'main', ...db });
    const result = await fn(db);
    await mdb.collection('store').updateOne({ _id: 'main' }, { $set: { products: db.products, orders: db.orders, whatsapp: db.whatsapp || {}, pushSubs: db.pushSubs || [] } }, { upsert: true });
    return result === undefined ? db : result;
  }
  if (!memoryDb.pushSubs) memoryDb.pushSubs = [];
  const r = await fn(memoryDb);
  return r === undefined ? memoryDb : r;
}
if (memoryDb && !memoryDb.whatsapp) memoryDb.whatsapp = {};
if (memoryDb && !memoryDb.pushSubs) memoryDb.pushSubs = [];
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || 'BKRivjS_fteRxBebjGAWH7rY-DTIjURJdGcJnoUhRnPUZs6Q27iZjfovG2zUt3UQ20E9LTPopm0GqzDBz00IVmw';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'tIkQZppZkv-5n1M6W_YlLI7tGRXgs722x4dsmlH_Cow';
let webpush = null;
async function getWebPush() {
  if (webpush) return webpush;
  try { const m = await import('web-push'); webpush = m.default; webpush.setVapidDetails('mailto:admin@hiyora.store', VAPID_PUBLIC, VAPID_PRIVATE); return webpush; } catch { return null; }
}
function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'غير مصرح' });
  try { req.admin = jwt.verify(t, JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'الجلسة انتهت، سجل الدخول مجدداً' }); }
}

app.get('/api', (req, res) => res.json({ name: 'HIYORA - واجهة برمجية للمتجر', version: '1.0.0' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/notify/test', async (req, res) => {
  const fake={id:'TEST123', customer:{name:'زبون تجريبي', phone:'0600000000', city:'Casa', address:'-'}, total:299, items:[{name:'منتج تجريبي', qty:1, price:299}]};
  const r = await notifyOrder(fake);
  const db=await getDb();
  res.json({ notify: r, db: db.whatsapp || {}, env:{ hasApiKey:!!(process.env.CALLMEBOT_APIKEY||process.env.WHATSAPP_APIKEY), hasWebhook:!!process.env.WHATSAPP_WEBHOOK, phone:process.env.ADMIN_PHONE||'not-set'} });
});
app.get('/api/settings/whatsapp', requireAdmin, async (req,res)=>{
  const db=await getDb();
  res.json(db.whatsapp || {});
});
app.post('/api/settings/whatsapp', requireAdmin, async (req,res)=>{
  const { phone, apikey, webhook, tgToken, tgChat, ultraInstance, ultraToken } = req.body || {};
  await updateDb(db=>{ db.whatsapp = { phone: phone||'', apikey: apikey||'', webhook: webhook||'', tgToken: tgToken||'', tgChat: tgChat||'', ultraInstance, ultraToken }; });
  res.json({ ok:true });
});
app.post('/api/notify/test-custom', requireAdmin, async (req,res)=>{
  const fake={id:'TEST123', customer:{name:'زبون تجريبي', phone:'0600000000', city:'Casa', address:'-'}, total:299, items:[{name:'منتج تجريبي', qty:1, price:299}]};
  await notifyOrder(fake);
  res.json({ ok:true });
});
app.get('/api/push/vapidPublicKey', (req,res)=> res.json({ publicKey: VAPID_PUBLIC }));
app.post('/api/push/subscribe', async (req,res)=>{
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({error:'bad sub'});
  await updateDb(db=>{ if(!db.pushSubs) db.pushSubs=[]; if(!db.pushSubs.find(s=>s.endpoint===sub.endpoint)) db.pushSubs.push(sub); });
  res.json({ok:true});
});
app.post('/api/push/test', requireAdmin, async (req,res)=>{
  await sendPush({title:'HIYORA تجريب', body:'هذا إشعار تجريبي - سيصلك كل طلب هنا'});
  res.json({ok:true});
});
async function sendPush(payload){
  const wp = await getWebPush();
  if (!wp) return;
  try{
    const db=await getDb();
    const subs=db.pushSubs||[];
    const data=JSON.stringify(payload);
    await Promise.all(subs.map(s=> wp.sendNotification(s, data).catch(e=>{ if(e.statusCode===410) {/* expired */}})));
  }catch(e){ console.error('[PUSH]',e.message); }
}
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, username });
  }
  return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
});
app.get('/api/auth/me', requireAdmin, (req, res) => res.json({ username: req.admin.username }));
app.get('/api/auth/stats', async (req, res) => {
  const d = await getDb();
  const revenue = d.orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  res.json({ productCount: d.products.length, orderCount: d.orders.length, pendingCount: d.orders.filter(o => o.status === 'pending').length, revenue });
});
app.get('/api/products', async (req, res) => {
  const q = (req.query.q || '').toString().trim().toLowerCase();
  const category = (req.query.category || '').toString().trim();
  let products = (await getDb()).products;
  if (category) products = products.filter(p => p.category === category);
  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.includes(q));
  res.json(products);
});
app.get('/api/products/categories', async (req, res) => {
  const cats = [...new Set((await getDb()).products.map(p => p.category).filter(Boolean))];
  res.json(cats);
});
app.post('/api/products', requireAdmin, async (req, res) => {
  const { name, price, category, description, image, stock } = req.body || {};
  if (!name || typeof price !== 'number' || price < 0) return res.status(400).json({ error: 'الاسم والسعر مطلوبان' });
  const product = { id: randomUUID(), name: String(name), price, category: category || '', description: description || '', image: image || '', stock: Number.isFinite(stock) ? stock : 0, createdAt: new Date().toISOString() };
  await updateDb(d => { d.products.unshift(product); return product; });
  res.status(201).json(product);
});
app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const r = await updateDb(d => {
    const i = d.products.findIndex(p => p.id === id);
    if (i === -1) return null;
    d.products[i] = { ...d.products[i], ...req.body, id };
    return d.products[i];
  });
  if (!r) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(r);
});
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const r = await updateDb(d => {
    const b = d.products.length;
    d.products = d.products.filter(p => p.id !== id);
    return d.products.length !== b;
  });
  if (!r) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json({ ok: true });
});
async function notifyOrder(order) {
  let phone = (process.env.ADMIN_PHONE || process.env.WHATSAPP_NUMBER || '').replace(/\D/g,'');
  let apikey = (process.env.CALLMEBOT_APIKEY || process.env.WHATSAPP_APIKEY || '').trim();
  let webhook = (process.env.WHATSAPP_WEBHOOK || '').trim();
  let tgToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  let tgChat = (process.env.TELEGRAM_CHAT_ID || '').trim();
  let ultraInstance = (process.env.ULTRAMSG_INSTANCE || '').trim();
  let ultraToken = (process.env.ULTRAMSG_TOKEN || '').trim();
  try {
    const db = await getDb();
    if (db.whatsapp) {
      if (!phone && db.whatsapp.phone) phone = String(db.whatsapp.phone).replace(/\D/g,'');
      if (!apikey && db.whatsapp.apikey) apikey = String(db.whatsapp.apikey).trim();
      if (!webhook && db.whatsapp.webhook) webhook = String(db.whatsapp.webhook).trim();
      if (!tgToken && db.whatsapp.tgToken) tgToken = String(db.whatsapp.tgToken).trim();
      if (!tgChat && db.whatsapp.tgChat) tgChat = String(db.whatsapp.tgChat).trim();
      if (!ultraInstance && db.whatsapp.ultraInstance) ultraInstance = String(db.whatsapp.ultraInstance).trim();
      if (!ultraToken && db.whatsapp.ultraToken) ultraToken = String(db.whatsapp.ultraToken).trim();
    }
  } catch {}
  if (!phone) phone = '212675993497';
  const text = `\uD83D\uDED2 طلب جديد HIYORA!\n\nرقم: ${order.id}\nالعميل: ${order.customer.name}\nهاتف: ${order.customer.phone}\nالمدينة: ${order.customer.city||'-'}\nالعنوان: ${order.customer.address||'-'}\nالإجمالي: ${order.total} DH\n\n${order.items.map(i=>`\u2022 ${i.name} x${i.qty} = ${i.price*i.qty} DH`).join('\n')}`;
  // ntfy - موضوع ثابت (يُرسل دائما)
  let ntfyOk=false;
  try { const rr=await fetch(`https://ntfy.sh/hiyora-675993497`, { method: 'POST', body: text, headers: { Title: 'طلب جديد HIYORA', Priority: 'high', Tags: 'shopping_cart' } }); ntfyOk=rr.ok; console.log('[NOTIFY] ntfy',rr.status); } catch(e){ console.error('[NOTIFY] ntfy failed',e.message); }
  // Web Push
  try { const wp = await getWebPush(); if (wp) { const db2=await getDb(); const subs=db2.pushSubs||[]; const payload=JSON.stringify({title:`طلب جديد #${order.id}`, body:`${order.customer.name} - ${order.total} DH`}); await Promise.all(subs.map(s=> wp.sendNotification(s, payload).catch(()=>{}))); console.log('[NOTIFY] webpush', subs.length); } } catch(e){ console.error('[NOTIFY] webpush failed',e.message); }
  // UltraMsg WhatsApp (أسهل - امسح QR فقط)
  if (ultraInstance && ultraToken) {
    try { const url=`https://api.ultramsg.com/${ultraInstance}/messages/chat`; const r=await fetch(url,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token:ultraToken, to:phone, body:text})}); console.log('[NOTIFY] UltraMsg',r.status, (await r.text()).slice(0,200)); if(r.ok) return; } catch(e){ console.error('[NOTIFY] UltraMsg failed',e.message); }
  }
  if (tgToken && tgChat) {
    try { const url=`https://api.telegram.org/bot${tgToken}/sendMessage`; const r=await fetch(url,{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({chat_id:tgChat, text})}); console.log('[NOTIFY] Telegram',r.status); if(r.ok) return; } catch(e){ console.error('[NOTIFY] Telegram failed',e.message); }
  }
  if (apikey && apikey !== 'YOUR_API_KEY_HERE' && apikey !== 'YOUR_KEY') {
    try { const url=`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apikey}`; console.log('[NOTIFY] CallMeBot',phone); const r=await fetch(url); console.log('[NOTIFY] status',r.status, (await r.text()).slice(0,200)); if(r.ok) return; } catch(e){ console.error('[NOTIFY] CallMeBot failed',e.message); }
  }
  if (webhook && !webhook.includes('YOUR_API_KEY')) {
    try { const sep=webhook.includes('?')?'&':'?'; const url=`${webhook}${sep}text=${encodeURIComponent(text)}&phone=${phone}`; const r=await fetch(url); console.log('[NOTIFY] webhook',r.status); if(r.ok) return {ntfyOk, webhook:true}; } catch(e){ console.error('[NOTIFY] webhook failed',e.message); }
  }
  return {ntfyOk};
}
app.post('/api/orders', async (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer || !customer.name || !customer.phone) return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'السلة فارغة' });
  const d = await getDb();
  const orderItems = [];
  for (const item of items) {
    const p = d.products.find(x => x.id === item.id);
    if (!p) return res.status(400).json({ error: `منتج غير موجود: ${item.name}` });
    const qty = Math.max(1, Math.min(Number(item.qty) || 1, p.stock > 0 ? p.stock : 99999));
    orderItems.push({ productId: p.id, name: p.name, price: p.price, qty });
  }
  const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const order = { id: randomUUID().slice(0, 8).toUpperCase(), customer: { name: String(customer.name), phone: String(customer.phone), address: customer.address || '', city: customer.city || '', notes: customer.notes || '' }, items: orderItems, total, status: 'pending', createdAt: new Date().toISOString() };
  await updateDb(db2 => {
    db2.orders.unshift(order);
    for (const it of orderItems) { const p = db2.products.find(x => x.id === it.productId); if (p && p.stock > 0) p.stock = Math.max(0, p.stock - it.qty); }
  });
  notifyOrder(order).catch(()=>{});
  res.status(201).json(order);
});
app.get('/api/orders', requireAdmin, async (req, res) => {
  const d = await getDb();
  const s = (req.query.status || '').toString();
  res.json(s ? d.orders.filter(o => o.status === s) : d.orders);
});
app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
  const r = await updateDb(d => {
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