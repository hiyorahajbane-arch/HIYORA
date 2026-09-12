import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.VERCEL ? join('/tmp', 'db.json') : join(__dirname, '..', 'data', 'db.json');

const DEFAULT_DB = {
  products: [],
  orders: []
};

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

function load() {
  if (!existsSync(DATA_FILE)) {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    const seed = { products: SEED_PRODUCTS.map(p => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, createdAt: new Date().toISOString(), ...p })), orders: [] };
    save(seed);
    return seed;
  }
  try {
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    if (!data.products || data.products.length === 0) {
      data.products = SEED_PRODUCTS.map(p => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, createdAt: new Date().toISOString(), ...p }));
      save(data);
    }
    return data;
  } catch {
    const seed = { products: SEED_PRODUCTS.map(p => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, createdAt: new Date().toISOString(), ...p })), orders: [] };
    try { save(seed); } catch {}
    return seed;
  }
}

function save(db) {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function getDb() {
  return load();
}

export function updateDb(mutator) {
  const db = load();
  const result = mutator(db);
  save(db);
  return result === undefined ? db : result;
}

export function resetDb() {
  save(structuredClone(DEFAULT_DB));
  return structuredClone(DEFAULT_DB);
}