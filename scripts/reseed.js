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
  // ملابس نساء
  { name: 'فستان صيفي مزهر', name_fr: 'Robe d\'été fleurie', name_en: 'Floral Summer Dress', category: 'ملابس', category_fr: 'Vêtements', category_en: 'Clothing', price: 249, oldPrice: 329, gender: 'women', description: 'فستان صيفي خفيف بنقشة مزهرة، مثالي للإطلالات النهارية.', image: 'https://picsum.photos/seed/hiyora-dress/600/600', stock: 20 },
  { name: 'قفطان مغربي أنيق', name_fr: 'Caftan marocain élégant', name_en: 'Elegant Moroccan Caftan', category: 'ملابس', category_fr: 'Vêtements', category_en: 'Clothing', price: 599, gender: 'women', description: 'قفطان تقليدي بتطريز راقٍ، للمناسبات والأفراح.', image: 'https://picsum.photos/seed/hiyora-caftan/600/600', stock: 10 },
  { name: 'قميص نسائي قطني', name_fr: 'Chemisier en coton', name_en: 'Cotton Blouse', category: 'ملابس', category_fr: 'Vêtements', category_en: 'Clothing', price: 129, gender: 'women', description: 'قميص قطني مريح بقصّة عصرية، متوفر بعدة ألوان.', image: 'https://picsum.photos/seed/hiyora-blouse/600/600', stock: 30 },
  // أحذية وحقائب نساء
  { name: 'حذاء كعب عالٍ', name_fr: 'Chaussure à talons hauts', name_en: 'High Heels', category: 'أحذية', category_fr: 'Chaussures', category_en: 'Shoes', price: 299, oldPrice: 399, gender: 'women', description: 'حذاء كعب أنيق ومريح للسهرات والمناسبات.', image: 'https://picsum.photos/seed/hiyora-heels/600/600', stock: 15 },
  { name: 'صندل صيفي مريح', name_fr: 'Sandale d\'été confortable', name_en: 'Comfortable Summer Sandal', category: 'أحذية', category_fr: 'Chaussures', category_en: 'Shoes', price: 149, gender: 'women', description: 'صندل خفيف ومريح للمشاوير اليومية.', image: 'https://picsum.photos/seed/hiyora-sandals/600/600', stock: 25 },
  { name: 'حقيبة يد جلدية', name_fr: 'Sac à main en cuir', name_en: 'Leather Handbag', category: 'حقائب', category_fr: 'Sacs', category_en: 'Bags', price: 349, gender: 'women', description: 'حقيبة يد من الجلد الفاخر بتصميم عملي وأنيق.', image: 'https://picsum.photos/seed/hiyora-handbag/600/600', stock: 12 },
  // إكسسوارات نساء
  { name: 'نظارة شمسية نسائية', name_fr: 'Lunettes de soleil femme', name_en: "Women's Sunglasses", category: 'إكسسوارات', category_fr: 'Accessoires', category_en: 'Accessories', price: 119, gender: 'women', description: 'نظارة شمسية بحماية UV وإطار عصري.', image: 'https://picsum.photos/seed/hiyora-sunglasses/600/600', stock: 40 },
  { name: 'ساعة يد نسائية', name_fr: 'Montre femme', name_en: "Women's Watch", category: 'إكسسوارات', category_fr: 'Accessoires', category_en: 'Accessories', price: 259, oldPrice: 329, gender: 'women', description: 'ساعة يد أنيقة بسوار معدني ذهبي.', image: 'https://picsum.photos/seed/hiyora-watch/600/600', stock: 18 },
  { name: 'وشاح حريري', name_fr: 'Écharpe en soie', name_en: 'Silk Scarf', category: 'إكسسوارات', category_fr: 'Accessoires', category_en: 'Accessories', price: 89, gender: 'women', description: 'وشاح من الحرير الناعم بألوان راقية.', image: 'https://picsum.photos/seed/hiyora-scarf/600/600', stock: 35 },
  // رجال
  { name: 'قميص رجالي كلاسيك', name_fr: 'Chemise classique homme', name_en: "Men's Classic Shirt", category: 'ملابس', category_fr: 'Vêtements', category_en: 'Clothing', price: 159, gender: 'men', description: 'قميص رجالي بقصّة كلاسيكية وخامة ممتازة.', image: 'https://picsum.photos/seed/hiyora-shirt/600/600', stock: 25 },
  { name: 'حذاء رياضي رجالي', name_fr: 'Baskets homme', name_en: "Men's Sneakers", category: 'أحذية', category_fr: 'Chaussures', category_en: 'Shoes', price: 279, gender: 'men', description: 'حذاء رياضي مريح وخفيف للاستعمال اليومي.', image: 'https://picsum.photos/seed/hiyora-sneakers/600/600', stock: 20 },
  { name: 'بنطلون جينز رجالي', name_fr: 'Pantalon denim homme', name_en: "Men's Jeans", category: 'ملابس', category_fr: 'Vêtements', category_en: 'Clothing', price: 189, gender: 'men', description: 'بنطلون جينز بقصّة عصرية وخامة متينة.', image: 'https://picsum.photos/seed/hiyora-jeans/600/600', stock: 22 },
  { name: 'ساعة يد رجالية', name_fr: 'Montre homme', name_en: "Men's Watch", category: 'إكسسوارات', category_fr: 'Accessoires', category_en: 'Accessories', price: 299, oldPrice: 379, gender: 'men', description: 'ساعة يد كلاسيكية بسوار جلدي بني.', image: 'https://picsum.photos/seed/hiyora-mwatch/600/600', stock: 14 },
  { name: 'حزام جلدي رجالي', name_fr: 'Ceinture cuir homme', name_en: "Men's Leather Belt", category: 'إكسسوارات', category_fr: 'Accessoires', category_en: 'Accessories', price: 99, gender: 'men', description: 'حزام من الجلد الطبيعي بمشبك معدني.', image: 'https://picsum.photos/seed/hiyora-belt/600/600', stock: 28 },
  { name: 'حقيبة ظهر عصرية', name_fr: 'Sac à dos moderne', name_en: 'Modern Backpack', category: 'حقائب', category_fr: 'Sacs', category_en: 'Bags', price: 199, gender: 'men', description: 'حقيبة ظهر عملية بجيوب متعددة.', image: 'https://picsum.photos/seed/hiyora-backpack/600/600', stock: 16 },
  // أطفال
  { name: 'طقم أطفال صيفي', name_fr: 'Tenue d\'été enfants', name_en: "Kids' Summer Outfit", category: 'ملابس', category_fr: 'Vêtements', category_en: 'Clothing', price: 99, gender: 'kids', description: 'طقم صيفي مريح ومرح لأطفالك.', image: 'https://picsum.photos/seed/hiyora-kids/600/600', stock: 30 },
  { name: 'فستان بناتي ملوّن', name_fr: 'Robe fille colorée', name_en: "Girls' Colorful Dress", category: 'ملابس', category_fr: 'Vêtements', category_en: 'Clothing', price: 119, gender: 'kids', description: 'فستان بناتي مبهج بألوان مرحة.', image: 'https://picsum.photos/seed/hiyora-girl-dress/600/600', stock: 20 },
  { name: 'حذاء أطفال ملوّن', name_fr: 'Chaussure enfant colorée', name_en: "Kids' Colorful Shoes", category: 'أحذية', category_fr: 'Chaussures', category_en: 'Shoes', price: 129, gender: 'kids', description: 'حذاء أطفال مريح بألوان زاهية.', image: 'https://picsum.photos/seed/hiyora-kids-shoes/600/600', stock: 24 },
  { name: 'قبعة أطفال', name_fr: 'Chapeau enfants', name_en: "Kids' Cap", category: 'إكسسوارات', category_fr: 'Accessoires', category_en: 'Accessories', price: 49, gender: 'kids', description: 'قبعة قطنية لحماية صغارك من الشمس.', image: 'https://picsum.photos/seed/hiyora-kids-cap/600/600', stock: 30 }
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
