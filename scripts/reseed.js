import 'dotenv/config.js';
import { randomUUID } from 'node:crypto';

const PRODUCTS = [
  // ملابس نساء
  { name: 'فستان صيفي مزهر', price: 249, oldPrice: 329, category: 'ملابس', gender: 'women', description: 'فستان صيفي خفيف بنقشة مزهرة، مثالي للإطلالات النهارية.', image: 'https://picsum.photos/seed/hiyora-dress/600/600', stock: 20 },
  { name: 'قفطان مغربي أنيق', price: 599, category: 'ملابس', gender: 'women', description: 'قفطان تقليدي بتطريز راقٍ، للمناسبات والأفراح.', image: 'https://picsum.photos/seed/hiyora-caftan/600/600', stock: 10 },
  { name: 'قميص نسائي قطني', price: 129, category: 'ملابس', gender: 'women', description: 'قميص قطني مريح بقصّة عصرية، متوفر بعدة ألوان.', image: 'https://picsum.photos/seed/hiyora-blouse/600/600', stock: 30 },
  // أحذية وحقائب نساء
  { name: 'حذاء كعب عالٍ', price: 299, oldPrice: 399, category: 'أحذية', gender: 'women', description: 'حذاء كعب أنيق ومريح للسهرات والمناسبات.', image: 'https://picsum.photos/seed/hiyora-heels/600/600', stock: 15 },
  { name: 'صندل صيفي مريح', price: 149, category: 'أحذية', gender: 'women', description: 'صندل خفيف ومريح للمشاوير اليومية.', image: 'https://picsum.photos/seed/hiyora-sandals/600/600', stock: 25 },
  { name: 'حقيبة يد جلدية', price: 349, category: 'حقائب', gender: 'women', description: 'حقيبة يد من الجلد الفاخر بتصميم عملي وأنيق.', image: 'https://picsum.photos/seed/hiyora-handbag/600/600', stock: 12 },
  // إكسسوارات نساء
  { name: 'نظارة شمسية نسائية', price: 119, category: 'إكسسوارات', gender: 'women', description: 'نظارة شمسية بحماية UV وإطار عصري.', image: 'https://picsum.photos/seed/hiyora-sunglasses/600/600', stock: 40 },
  { name: 'ساعة يد نسائية', price: 259, oldPrice: 329, category: 'إكسسوارات', gender: 'women', description: 'ساعة يد أنيقة بسوار معدني ذهبي.', image: 'https://picsum.photos/seed/hiyora-watch/600/600', stock: 18 },
  { name: 'وشاح حريري', price: 89, category: 'إكسسوارات', gender: 'women', description: 'وشاح من الحرير الناعم بألوان راقية.', image: 'https://picsum.photos/seed/hiyora-scarf/600/600', stock: 35 },
  // رجال
  { name: 'قميص رجالي كلاسيك', price: 159, category: 'ملابس', gender: 'men', description: 'قميص رجالي بقصّة كلاسيكية وخامة ممتازة.', image: 'https://picsum.photos/seed/hiyora-shirt/600/600', stock: 25 },
  { name: 'حذاء رياضي رجالي', price: 279, category: 'أحذية', gender: 'men', description: 'حذاء رياضي مريح وخفيف للاستعمال اليومي.', image: 'https://picsum.photos/seed/hiyora-sneakers/600/600', stock: 20 },
  // أطفال
  { name: 'طقم أطفال صيفي', price: 99, category: 'ملابس', gender: 'kids', description: 'طقم صيفي مريح ومرح لأطفالك.', image: 'https://picsum.photos/seed/hiyora-kids/600/600', stock: 30 }
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI غير موجود في server/.env');
  process.exit(1);
}

const { MongoClient } = await import('mongodb');
const client = new MongoClient(uri);
await client.connect();
const col = client.db('souk').collection('store');

const products = PRODUCTS.map((p) => ({ id: randomUUID(), createdAt: new Date().toISOString(), ...p }));
const existing = await col.findOne({ _id: 'main' });
if (existing) {
  await col.updateOne({ _id: 'main' }, { $set: { products } });
  console.log(`تم استبدال المنتجات: ${products.length} منتج (الطلبات محفوظة: ${existing.orders?.length || 0})`);
} else {
  await col.insertOne({ _id: 'main', products, orders: [] });
  console.log(`تم إنشاء المتجر: ${products.length} منتج`);
}
await client.close();
