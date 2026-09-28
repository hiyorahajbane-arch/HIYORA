# دارها أكاديمي — Dariya Academy

منصة تعلم اللغات للمغاربة في المهجر: **الدارجة، الفرنسية، الإنجليزية، الإسبانية، والألمانية**.
الواجهة كتخدم بثلاث لغات: **الدارجة، العربية، والفرنسية**.

## شنو كاين فـ الديمو

- **دروس حقيقية** (17 درس): شرح، قواعد، مفردات، وأمثلة مع صوت.
- **6 أنواع ديال التمارين**: `mcq` (اختيار)، `fill` (فراغ)، `translate` (ترجمة)، `listen` (سمع)، `speak` (تكلم)، `order` (ترتيب الكلمات).
- **النطق**: `speechSynthesis` للاستماع، و`SpeechRecognition` للتسجيل الصوتي.
- **المسرد**: كل الكلمات مجمّعة، مع بحث وتصفية حسب اللغة.
- **التقدم**: XP، سلسلة الأيام (streak)، ودقة الإجابات.
- **حساب**: تسجيل ودخول بـ JWT، وحساب ديمو جاهز.

## التشغيل

### الطريقة السريعة: `star.bat`

double-click على `star.bat`، وهو كيدير كلشي بوحدو: يتأكد من Node، يثبت الحزم الناقصة،
يولّد `lessons.json`، كيختار بين dev و production، وكيحل المتصفح.

| الأمر | شنو كيدير |
|---|---|
| `star.bat` | تلقائي: production إلا كان `client/dist` موجود، وإلا dev |
| `star.bat dev` | API + Vite (hot reload) |
| `star.bat prod` | يبني إلا لازم، ومن بعد كيخدم كلشي من Express |
| `star.bat rebuild` | build جديد من الصفر ومن بعد كيخدم |
| `star.bat test` | 24 فحص ديال API + 6 فحوصات ديال dev client |
| `star.bat lint` | فحص الـ content |
| `star.bat reset` | كيمسح الداتا، كيعاود seed، وكيبدا |
| `star.bat clean` | كيمسح `node_modules` و`dist` و`data` |

زيد `star.bat dev --no-open` باش ما يحلش المتصفح.

إلا كان port 4000 مشغول (serve قديم)، `star.bat` كيروح لـ 4001 أو أكثر بوحدو.

### بالأوامر

```bash
npm run install:all     # يثبت الحزم ديال server و client
npm run seed            # يولّد data/db.json و data/lessons.json
npm run dev             # server :4000 + vite :5173
```

للتجربة فـ production:

```bash
npm run build           # يبني client/dist
npm start               # Express كخدم الـ API + يخدم الـ SPA
```

إلا بغيتي تبدا من الصفر بجميع الداتا:

```bash
npm run seed:force
```

## الاختبارات

```bash
npm test                # 24 فحص ديال API + SPA، فـ process واحد
npm run test:client     # 6 فحوصات ديال Vite dev server + proxy
npm run lint:content    # فحص content: syntax + CJK + translation leakage
```

## حسابات الديمو

| الإيميل | الباسوورد |
| --- | --- |
| `demo@dariya.academy` | `demo1234` |
| `salma@dariya.academy` | `salma1234` |
| `hamza@dariya.academy` | `hamza1234` |

## البنية

```
client/          React + Vite
  src/lib/       api.js, speech.js, content.js, i18n.jsx
  src/pages/     Home, Courses, Lesson, Quiz, Glossary, Progress, Settings
server/
  src/app.js     Express app (مفصول باش الاختبار يقدر يشعلو)
  src/routes/    auth.js, content.js
  src/content/   courses + darija/fr/en/es/de lessons
  scripts/       smoke.mjs (API end-to-end)
scripts/         check-content.mjs (linter ديال المحتوى)
```

## ملاحظات تقنية

- **Content هو المصدر ديال الحقيقة**. فـ البوت ديال السيرفر، `data/lessons.json` كيتولد من
  `src/content/*`، يعني كتبدّل شي درس وكترجع تحيد الداتا باش تشوف التعديل.
- **الإجابات ما كتسيفطش للمتصفح**: `/lessons/:id/exercises` كيحيد `answer` و`accept`.
  التصحيح كيتم فـ السيرفر ديما.
- **تمارين `speak`** كيتصححو بـ overlap ديال الكلمات (≥60%) ماشي بمطابقة حرف بحرف،
  حيت التسجيل الصوتي كيرجع الجملة ناقصة ديال الحروف الصغيرة.
- **STT** خدام غير فـ Chrome/Edge. فـ المتصفحات الأخرى، التطبيق كيبين رسالة ويطلب من المستخدم يسمع ويعاود بجوجو.
- `JWT_SECRET` و`CORS_ORIGINS` كتقرا من `server/.env` (استعمل `.env.example` كمرجع). فـ dev، السيرفر كيستعمل مفتاح تجريبي.
- فـ **dev** استعمل `npm.cmd` بدل `npm` إلا كان PowerShell كايسد `npm.ps1`.
