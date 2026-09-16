import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isVercel = !!process.env.VERCEL;
const DATA_FILE = isVercel ? join('/tmp', 'db.json') : join(__dirname, '..', 'data', 'db.json');

const SEED_PRODUCTS = [
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
    products: SEED_PRODUCTS.map(p => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, createdAt: new Date().toISOString(), ...p })),
    orders: [],
    whatsapp: {},
    site: {}
  };
}

// Mongo support
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

let memoryDb = null;
if (isVercel && !process.env.MONGODB_URI) {
  const g = globalThis;
  if (!g.__soukDb) g.__soukDb = makeSeed();
  memoryDb = g.__soukDb;
}
if (memoryDb && !memoryDb.whatsapp) memoryDb.whatsapp = {};

function loadSync() {
  if (process.env.MONGODB_URI) throw new Error('Use async getDb for Mongo');
  if (isVercel) return memoryDb;
  if (!existsSync(DATA_FILE)) {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    const seed = makeSeed();
    saveSync(seed);
    return seed;
  }
  try {
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    if (!data.products || data.products.length === 0) {
      data.products = makeSeed().products;
      saveSync(data);
    }
    return data;
  } catch {
    const seed = makeSeed();
    try { saveSync(seed); } catch {}
    return seed;
  }
}

function saveSync(db) {
  if (process.env.MONGODB_URI) throw new Error('Use async for Mongo');
  if (isVercel) {
    memoryDb.products = db.products;
    memoryDb.orders = db.orders;
    return;
  }
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export async function getDb() {
  if (process.env.MONGODB_URI) {
    const mdb = await getMongoDb();
    const doc = await mdb.collection('store').findOne({ _id: 'main' });
    if (!doc) {
      const seed = makeSeed();
      await mdb.collection('store').insertOne({ _id: 'main', ...seed });
      return seed;
    }
    return { products: doc.products || [], orders: doc.orders || [], whatsapp: doc.whatsapp || {}, site: doc.site || {} };
  }
  const d = loadSync();
  if (!d.whatsapp) d.whatsapp = {};
  if (!d.site) d.site = {};
  return d;
}

export async function updateDb(mutator) {
  if (process.env.MONGODB_URI) {
    const mdb = await getMongoDb();
    const doc = await mdb.collection('store').findOne({ _id: 'main' });
    const db = doc ? { products: doc.products || [], orders: doc.orders || [], whatsapp: doc.whatsapp || {}, site: doc.site || {} } : makeSeed();
    if (!doc) await mdb.collection('store').insertOne({ _id: 'main', ...db });
    const result = await mutator(db);
    await mdb.collection('store').updateOne({ _id: 'main' }, { $set: { products: db.products, orders: db.orders, whatsapp: db.whatsapp || {}, site: db.site || {} } }, { upsert: true });
    return result === undefined ? db : result;
  }
  const db = loadSync();
  if (!db.whatsapp) db.whatsapp = {};
  if (!db.site) db.site = {};
  const result = await mutator(db);
  saveSync(db);
  return result === undefined ? db : result;
}

export async function resetDb() {
  if (process.env.MONGODB_URI) {
    const mdb = await getMongoDb();
    const seed = makeSeed();
    await mdb.collection('store').updateOne({ _id: 'main' }, { $set: seed }, { upsert: true });
    return seed;
  }
  if (isVercel) {
    const seed = makeSeed();
    memoryDb.products = seed.products;
    memoryDb.orders = seed.orders;
    return memoryDb;
  }
  const { products, orders } = { products: [], orders: [] };
  saveSync({ products, orders });
  return { products, orders };
}

// Sync wrappers for backward compatibility where not awaited (local dev)
export function getDbSync() { return loadSync(); }
