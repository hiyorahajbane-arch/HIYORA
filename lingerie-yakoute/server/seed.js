import { randomUUID } from 'node:crypto';
import { updateDb } from './lib/db.js';

const sampleProducts = [
  {
    name: 'فستان صيفي أنيق',
    price: 249,
    category: 'ملابس',
    description: 'فستان صيفي خفيف بقصّة عصرية، مثالي للإطلالات النهارية.',
    image: 'https://picsum.photos/seed/lingerie-yakoute-dress/600/600',
    stock: 20
  },
  {
    name: 'حذاء كعب عالٍ',
    price: 299,
    category: 'أحذية',
    description: 'حذاء كعب أنيق ومريح للسهرات والمناسبات.',
    image: 'https://picsum.photos/seed/lingerie-yakoute-heels/600/600',
    stock: 15
  },
  {
    name: 'حقيبة يد جلدية',
    price: 349,
    category: 'حقائب',
    description: 'حقيبة يد من الجلد الفاخر بتصميم عملي وأنيق.',
    image: 'https://picsum.photos/seed/lingerie-yakoute-handbag/600/600',
    stock: 12
  },
  {
    name: 'ساعة يد نسائية',
    price: 259,
    category: 'إكسسوارات',
    description: 'ساعة يد أنيقة بسوار معدني ذهبي.',
    image: 'https://picsum.photos/seed/lingerie-yakoute-watch/600/600',
    stock: 18
  },
  {
    name: 'قميص قطني أساسي',
    price: 89,
    category: 'ملابس',
    description: 'قميص قطني مريح متوفر بألوان متعددة.',
    image: 'https://picsum.photos/seed/tshirt/600/600',
    stock: 60
  },
  {
    name: 'حذاء رياضي لايت',
    price: 249,
    category: 'أحذية',
    description: 'حذاء رياضي خفيف ومريح للجري والمشي اليومي.',
    image: 'https://picsum.photos/seed/shoes/600/600',
    stock: 20
  },
  {
    name: 'حقيبة ظهر أنيقة',
    price: 149,
    category: 'حقائب',
    description: 'حقيبة ظهر مقاومة للماء بمساحة لللابتوب حتى 15.6 بوصة.',
    image: 'https://picsum.photos/seed/backpack/600/600',
    stock: 35
  },
  {
    name: 'نظارة شمسية كلاسيك',
    price: 119,
    category: 'إكسسوارات',
    description: 'نظارة شمسية بحماية UV400 وإطار متين.',
    image: 'https://picsum.photos/seed/sunglasses/600/600',
    stock: 50
  }
];

updateDb((db) => {
  if (db.products.length === 0) {
    db.products = sampleProducts.map((p) => ({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...p
    }));
    console.log(`[LINGERIE YAKOUTE] تمت إضافة ${db.products.length} منتج تجريبي`);
  } else {
    console.log('[LINGERIE YAKOUTE] توجد منتجات سابقة، لا حاجة للتهيئة');
  }
});