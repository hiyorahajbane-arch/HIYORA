# 🛍️ LINGERIE YAKOUTE — متجر إلكتروني كامل

نسخة مطابقة لموقع HIYORA FASHION، مع تغيير الاسم فقط إلى **LINGERIE YAKOUTE**.
نفس المعلومات، نفس الديزاين، نفس المنتجات، نفس رقم الواتساب (+212675993497).

التقنيات: **React (Vite)** للواجهة + **Node.js (Express)** للخادم + تخزين JSON.

## التشغيل

> يتطلب Node.js 18 أو أحدث.
> البورتات مختلفة عن HIYORA باش يخدمو بجوج في نفس الوقت:
> - السيرفر: http://localhost:3002
> - الواجهة (dev): http://localhost:5174

```bash
# 1. تثبيت الحزم
npm run install:all

# 2. تهيئة منتجات تجريبية (نفس منتجات HIYORA)
npm run seed

# 3a. وضع التطوير
npm run dev:server   # http://localhost:3002
npm run dev:client   # http://localhost:5174

# 3b. أو الإنتاج
npm run build
npm start            # http://localhost:3002
```

أو دوبل-كليك على `START.BAT` / `DEV.BAT`.

## الإدارة

- المستخدم: `admin`
- كلمة المرور: `admin123`

## الفرق عن HIYORA

| HIYORA | LINGERIE YAKOUTE |
|---|---|
| HIYORA FASHION | LINGERIE YAKOUTE |
| hiyora.vercel.app | lingerie-yakoute.vercel.app |
| contact@hiyora.store | contact@lingerie-yakoute.store |
| ntfy: hiyora-675993497 | ntfy: lingerie-yakoute-675993497 |
| port 3001 / 5173 | port 3002 / 5174 |
| localStorage: souk_lang / hiyora.site.v1 | lingerie-yakoute_lang / lingerie-yakoute.site.v1 |
| Mongo DB: souk | Mongo DB: lingerie-yakoute |

رقم الواتساب والدفع عند الاستلام والتوصيل: نفس المعلومات.
