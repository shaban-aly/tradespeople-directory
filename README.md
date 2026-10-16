# دليل صنايعية السويس (Daleel Al-Suez)

دليل رقمي شامل وموثق يربط أهالي محافظة السويس بأفضل الصنايعية والفنيين في مختلف التخصصات والحرف المهنية، مع نظام تقييم موثق وإشعارات فورية وإدارة متكاملة للطلبات ولوحات تحكم مخصصة.

---

## 🛠️ التقنيات المستخدمة

- **Framework**: [Next.js](https://nextjs.org/) 16+ (App Router, Server Components, `proxy.ts` لحماية المسارات).
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode).
- **Database & Auth & Storage**: [Supabase](https://supabase.com/) (PostgreSQL 15+, RLS Policies, Database Functions, Triggers, Storage Buckets).
- **Push Notifications**: Firebase Cloud Messaging (FCM) + Service Worker موحد (`public/sw.js`).
- **Styling & UI**: Tailwind CSS + CSS Variables (`app/globals.css`) مع دعم كامل للثيم الفاتح والداكن (Dark/Light Mode) وتصميم متجاوب Mobile-First باللغة العربية (RTL).
- **Testing**: [Vitest](https://vitest.dev/) (أكثر من 1,300 اختبار يغطي المنطق، الصلاحيات، المهاجرات، والأمان).

---

## 🔐 نظام الأدوار والصلاحيات

المشروع يطبق نموذج تحكم صارم بالوصول (RBAC) مدعوماً بـ Row Level Security (RLS) على مستوى قاعدة البيانات وحراسة المسارات في `proxy.ts`:

| الدور | القيمة | الصلاحيات والوصول |
|-------|--------|------------------|
| **عميل (Client)** | `client` | تصفح الدليل، البحث الذكي، التواصل مع الفنيين، إضافة التقييمات، إدارة المفضلة وطلبات الصيانة الخاصة به |
| **صنايعي (Craftsman)** | `craftsman` | جميع صلاحيات العميل + لوحة تحكم الفني (`/dashboard`)، استقبال طلبات العملاء (Leads)، وإحصائيات الزيارات والاتصالات |
| **مشرف (Admin)** | `admin` | تحكم كامل بالنظام (`/admin`)، مراجعة واعتماد طلبات الانضمام، الرقابة على البلاغات والرسائل، إدارة الفئات والطلبات، والإشعارات الجماعية |

---

## ⚙️ متغيرات البيئة (Environment Variables)

أنشئ ملف `.env.local` في جذر المشروع وأضف المتغيرات التالية:

### 1. إعدادات Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_WEBHOOK_SECRET=
```

### 2. إعدادات Firebase Cloud Messaging (FCM)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
PUSH_FUNCTION_URL=
PUSH_FUNCTION_SECRET=
```

### 3. إعدادات التحليلات (Google Analytics 4)
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=
GA_SERVICE_ACCOUNT_JSON=
GA_PROPERTY_ID=
NEXT_PUBLIC_GA_PROPERTY_ID=
```

---

## 🚀 أوامر التشغيل والتطوير

```bash
# تثبيت الاعتماديات
npm install

# تشغيل خادم التطوير المحلي
npm run dev

# بناء المشروع للإنتاج (Production Build)
npm run build

# تشغيل التطبيق في وضع الإنتاج
npm run start

# فحص الأنواع (TypeScript Type Checking)
npm run typecheck

# فحص وتدقيق الأكواد (ESLint)
npm run lint

# تشغيل جميع اختبارات المشروع (Vitest)
npm run test
```

---

## 🗄️ إدارة قاعدة البيانات والمهاجرات (Migrations)

تخضع قاعدة البيانات لنظام هجرة تسلسلي يبدأ من `0001_initial_schema.sql` داخل مجلد `supabase/migrations/`:

```bash
# تسجيل الدخول إلى Supabase CLI
npx supabase login

# ربط المشروع بمشروع Supabase البعيد
npx supabase link --project-ref <your-project-ref>

# تطبيق جميع المهاجرات الجديدة على السيرفر البعيد
npx supabase db push

# توليد أنواع TypeScript من قاعدة البيانات الحية
npx supabase gen types typescript --linked > lib/db/database.types.ts
```

---

## 📁 هيكل المجلدات الرئيسي

```text
├── app/                  # مسارات وواجهات Next.js App Router (صفحات ومسارات API)
├── components/           # مكوّنات الواجهة مقسمة وظيفياً (admin, craftsman, home, shared...)
├── hooks/                # الـ Custom Hooks مفصولة المنطق عن العرض
├── lib/                  # دوال الأعمال، الاتصال بقاعدة البيانات، الأدوات المساعدة، والأنواع
│   ├── db/               # استعلامات Supabase وعمليات السيرفر
│   ├── push/             # منطق إشعارات FCM
│   └── utils/            # دوال الحماية والتنسيق
├── public/               # الملفات الثابتة والـ Service Worker الأساسي (sw.js)
├── supabase/             # ملفات المهاجرات (migrations) والدوال السحابية
└── tests/                # حزم اختبارات شاملة للمنطق والـ API والـ Migrations
```

---

## 🔒 الأمان والممارسات القياسية

- **حماية المسارات**: معالجة الحماية المركزية عبر `proxy.ts` (Next.js 16+) مع منع ثغرات Open Redirect باستخدام `isSafeInternalLink`.
- **أمان الاستعلامات**: الاعتماد الكامل على Server Actions وRPC Functions مع التحقق الصارم من الهوية والجلسة من جهة الخادم لمنع هجمات IDOR.
- **التوقيت الآمن**: مقارنة أسرار Webhooks باستخدام `timingSafeEqual` لمنع Timing Attacks.
- **عزل الصلاحيات**: تطبيق `SET search_path TO 'public'` على جميع دوال `SECURITY DEFINER` لمنع Search Path Hijacking.
- **إشعارات موحدة**: تحكم حصري في Service Worker عبر `public/sw.js` لمنع ازدواجية إشعارات الـ Push والتعامل السليم مع النقرات.
