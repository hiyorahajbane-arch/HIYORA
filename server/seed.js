import { randomUUID } from 'node:crypto';
import { updateDb } from './lib/db.js';

const sampleProducts = [
  {
    name: 'هاتف ذكي نوفا X',
    price: 1299,
    category: 'إلكترونيات',
    description: 'هاتف ذكي بشاشة 6.7 بوصة وكاميرا 108MP وبطارية 5000mAh.',
    image: 'https://picsum.photos/seed/phone/600/600',
    stock: 25
  },
  {
    name: 'لابتوب برو 15',
    price: 3499,
    category: 'إلكترونيات',
    description: 'لابتوب بشاشة 15.6 بوصة ومعالج حديث وبطارية تدوم 12 ساعة.',
    image: 'https://picsum.photos/seed/laptop/600/600',
    stock: 8
  },
  {
    name: 'سماعات لاسلكية زين',
    price: 199,
    category: 'إلكترونيات',
    description: 'سماعات تعزل الضجيج ببطارية 30 ساعة وبلوتوث 5.3.',
    image: 'https://picsum.photos/seed/headset/600/600',
    stock: 40
  },
  {
    name: 'ساعة ذكية فيت مين',
    price: 449,
    category: 'إلكترونيات',
    description: 'ساعة ذكية تقيس نبضات القلب والنوم والتمارين الرياضية.',
    image: 'https://picsum.photos/seed/watch/600/600',
    stock: 30
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
    category: 'ملابس',
    description: 'حذاء رياضي خفيف ومريح للجري والمشي اليومي.',
    image: 'https://picsum.photos/seed/shoes/600/600',
    stock: 20
  },
  {
    name: 'حقيبة ظهر أنيقة',
    price: 149,
    category: 'إكسسوارات',
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
    console.log(`[HIYORA] تمت إضافة ${db.products.length} منتج تجريبي`);
  } else {
    console.log('[HIYORA] توجد منتجات سابقة، لا حاجة للتهيئة');
  }
});