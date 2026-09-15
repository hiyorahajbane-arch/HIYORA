import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const f of [join(ROOT, 'server', '.env'), join(ROOT, '.env')]) {
  if (existsSync(f)) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const PRODUCTS = [
  { name: 'بنطلون جينز رجالي', name_fr: 'Pantalon denim homme', name_en: "Men's Jeans", price: 189, category: 'ملابس', gender: 'men', description: 'بنطلون جينز بقصّة عصرية وخامة متينة.', image: 'https://picsum.photos/seed/hiyora-jeans/600/600', stock: 22 },
  { name: 'ساعة يد رجالية', name_fr: 'Montre homme', name_en: "Men's Watch", price: 299, oldPrice: 379, category: 'إكسسوارات', gender: 'men', description: 'ساعة يد كلاسيكية بسوار جلدي بني.', image: 'https://picsum.photos/seed/hiyora-mwatch/600/600', stock: 14 },
  { name: 'حزام جلدي رجالي', name_fr: 'Ceinture cuir homme', name_en: "Men's Leather Belt", price: 99, category: 'إكسسوارات', gender: 'men', description: 'حزام من الجلد الطبيعي بمشبك معدني.', image: 'https://picsum.photos/seed/hiyora-belt/600/600', stock: 28 },
  { name: 'حقيبة ظهر عصرية', name_fr: 'Sac à dos moderne', name_en: 'Modern Backpack', price: 199, category: 'حقائب', gender: 'men', description: 'حقيبة ظهر عملية بجيوب متعددة.', image: 'https://picsum.photos/seed/hiyora-backpack/600/600', stock: 16 },
  { name: 'فستان بناتي ملوّن', name_fr: 'Robe fille colorée', name_en: "Girls' Colorful Dress", price: 119, category: 'ملابس', gender: 'kids', description: 'فستان بناتي مبهج بألوان مرحة.', image: 'https://picsum.photos/seed/hiyora-girl-dress/600/600', stock: 20 },
  { name: 'حذاء أطفال ملوّن', name_fr: 'Chaussure enfant colorée', name_en: "Kids' Colorful Shoes", price: 129, category: 'أحذية', gender: 'kids', description: 'حذاء أطفال مريح بألوان زاهية.', image: 'https://picsum.photos/seed/hiyora-kids-shoes/600/600', stock: 24 },
  { name: 'قبعة أطفال', name_fr: 'Chapeau enfants', name_en: "Kids' Cap", price: 49, category: 'إكسسوارات', gender: 'kids', description: 'قبعة قطنية لحماية صغارك من الشمس.', image: 'https://picsum.photos/seed/hiyora-kids-cap/600/600', stock: 30 }
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI غير موجود');
  process.exit(1);
}

const { MongoClient } = await import('mongodb');
const client = new MongoClient(uri);
await client.connect();
const col = client.db('souk').collection('store');

const products = PRODUCTS.map((p) => ({ id: randomUUID(), createdAt: new Date().toISOString(), ...p }));
const existing = await col.findOne({ _id: 'main' });
if (existing) {
  const names = new Set((existing.products || []).map((p) => p.name));
  const fresh = products.filter((p) => !names.has(p.name));
  if (fresh.length === 0) {
    console.log('كل المنتجات موجودة مسبقاً، لا حاجة للإضافة.');
  } else {
    await col.updateOne({ _id: 'main' }, { $push: { products: { $each: fresh, $position: 0 } } });
    console.log(`تمت إضافة ${fresh.length} منتج جديد.`);
  }
} else {
  await col.insertOne({ _id: 'main', products, orders: [] });
  console.log(`تم إنشاء المتجر: ${products.length} منتج`);
}
await client.close();
