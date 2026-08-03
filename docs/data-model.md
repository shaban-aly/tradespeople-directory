# نموذج البيانات — دليل الصنايعية

مصدر البيانات الحالي: **Supabase**.

الجداول المستخدمة الآن:

- `categories`
- `areas`
- `craftsmen`
- `social_links`
- `join_requests`
- `contact_messages`
- `craftsman_stats`
- `profiles`

الواجهة الأمامية ما زالت تتعامل مع موديلات TypeScript مبسطة من `lib/craftsmen.ts`
بينما الجلب الفعلي يتم من `lib/db.ts`.

## `Craftsman` — الشكل المستخدم في الواجهة

| الحقل | النوع | الوصف | مثال |
|-------|-------|-------|------|
| `id` | `string` | UUID من Supabase | `"7b6..."` |
| `slug` | `string` | الرابط المقروء لصفحة التفاصيل | `"plumbing-1"` |
| `name` | `string` | اسم الصنايعي | `"عم محمود عبد الرحمن"` |
| `category` | `string` | slug التخصص | `"plumbing"` |
| `image` | `string` | رابط الصورة العام (Storage أو خارجي) | `"https://..."` |
| `phone` | `string` | رقم الهاتف بصيغة دولية | `"+20 100 123 4567"` |
| `whatsapp` | `string` | رقم الواتساب | `"201001234567"` |
| `area` | `string` | اسم المنطقة | `"الأربعين"` |
| `description` | `string` | وصف قصير | `"سباك خبرة 15 سنة..."` |
| `verified` | `boolean` | هل الصنايعي موثّق؟ | `true` |
| `addedAt` | `string` | تاريخ الإضافة بصيغة ISO | `"2026-07-30"` |
| `socialLinks` | `SocialLink[]` (اختياري) | روابط السوشيال | `[{ platform: "facebook", url: "https://..." }]` |

## `Category` — الشكل المستخدم في الواجهة

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `slug` | `string` | slug التخصص |
| `name` | `string` | الاسم العربي |
| `icon` | `string` | اسم أيقونة `CategoryIcon` |

## `SocialLink`

| الحقل | النوع |
|-------|-------|
| `platform` | `"facebook" \| "instagram" \| "tiktok" \| "other"` |
| `url` | `string` |

## الجداول في Supabase

### `categories`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| `id` | `uuid` | PK |
| `slug` | `text` | unique |
| `name` | `text` | |
| `icon` | `text` | يجب أن يطابق أسماء `CategoryIcon` الحالية |
| `sort_order` | `int` | ترتيب العرض |
| `is_active` | `boolean` | إظهار/إخفاء |

### `areas`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| `id` | `uuid` | PK |
| `name` | `text` | unique |
| `sort_order` | `int` | ترتيب العرض |
| `is_active` | `boolean` | إظهار/إخفاء |

### `craftsmen`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| `id` | `uuid` | PK |
| `slug` | `text` | unique |
| `name` | `text` | |
| `category_id` | `uuid` | FK -> `categories.id` |
| `area_id` | `uuid` | FK -> `areas.id` |
| `image_url` | `text` | رابط الصورة العام |
| `phone` | `text` | |
| `whatsapp` | `text` | nullable |
| `description` | `text` | nullable |
| `verified` | `boolean` | |
| `added_at` | `date` | |
| `is_published` | `boolean` | يظهر في الموقع فقط إذا كان `true` |

### `social_links`

| العمود | النوع | ملاحظات |
|--------|-------|---------|
| `id` | `uuid` | PK |
| `craftsman_id` | `uuid` | FK -> `craftsmen.id` |
| `platform` | `text` | check |
| `url` | `text` | |

### `join_requests`

| العمود | النوع | الاستخدام |
|--------|-------|-----------|
| `type` | `text` | `register` أو `report` |
| `name` | `text` | اسم مقدم طلب التسجيل |
| `category_id` | `uuid` | التخصص المختار |
| `area_id` | `uuid` | المنطقة المختارة |
| `phone` | `text` | رقم التواصل |
| `whatsapp` | `text` | واتساب اختياري |
| `description` | `text` | وصف قصير |
| `image_url` | `text` | صورة WebP مرفوعة إلى Storage |
| `social_links` | `jsonb` | روابط السوشيال (اختياري) — `[{ platform, url }]` تُنسخ إلى `social_links` عند الموافقة |
| `craftsman_name` | `text` | اسم الصنايعي في البلاغ |
| `report_message` | `text` | وصف المشكلة |
| `status` | `text` | `pending` / `approved` / `rejected` |

### `craftsman_stats`

جدول عدادات التفاعل الداخلية لكل صنايعي (غير ظاهرة للزوار):

| العمود | النوع | الاستخدام |
|--------|-------|-----------|
| `craftsman_id` | `uuid` | PK — FK -> `craftsmen.id` على حذف متسلسل |
| `views` | `integer` | عدد مشاهدات صفحة التفاصيل (افتراضي 0) |
| `calls` | `integer` | عدد ضغطات زراير الاتصال (افتراضي 0) |
| `whatsapp` | `integer` | عدد ضغطات زراير الواتساب (افتراضي 0) |
| `updated_at` | `timestamptz` | آخر تحديث |

التسجيل عبر دالة `increment_craftsman_stat(p_slug, p_metric)` (security definer)
التي تقوم بـ upsert ذرّي على العمود المطلوب (`view`/`call`/`whatsapp`) وتتجاهل
الصنايعية غير المنشورين، وتُرجع `boolean` (true عند التسجيل، false إذا الصنايعي
غير موجود أو غير منشور). `craftsman_stats` يسمح بقراءة عامة (للترتيب والعرض)
ولا يسمح بالتعديل المباشر إلا عبر الدالة.

مشاهدات الصفحة تُحسب مرة واحدة فقط لكل جهاز لكل صنايعي في اليوم الواحد: العميل
يحفظ (`slug → تاريخ اليوم`) في `localStorage` عبر `hooks/useStats.ts`، فإذا كان
الصنايعي مفتوحاً من نفس الجهاز في نفس اليوم لا يُرسَل أي طلب للسيرفر إطلاقاً
(والطلب يُرسَل فقط عند أول مشاهدة يومية). ضغطات الاتصال/الواتساب تُسجَّل دائماً
لأنها أفعال مقصودة.

### `profiles`

| العمود | النوع | الاستخدام |
|--------|-------|-----------|
| `id` | `uuid` | يساوي `auth.users.id` |
| `is_admin` | `boolean` | صلاحية المشرف |

### `contact_messages`

| العمود | النوع | الاستخدام |
|--------|-------|-----------|
| `id` | `uuid` | PK |
| `name` | `text` | اسم المرسل |
| `phone` | `text` | رقم هاتف أو واتساب |
| `message` | `text` | نص الرسالة |
| `is_read` | `boolean` | مقروءة/غير مقروءة |
| `created_at` | `timestamptz` | وقت الإرسال |

### `rate_limits`

جدول مشترك (server-side) لتقنين معدل الطلبات بدل الذاكرة، ليعمل بشكل صحيح عند
النشر على نسخ متعددة.

| العمود | النوع | الاستخدام |
|--------|-------|-----------|
| `key` | `text` | PK — مفتاح النافذة (مثل `search:IP:full` أو `sign:IP:requests`) |
| `window_start` | `timestamptz` | بداية النافذة الحالية |
| `count` | `int` | عدد الطلبات في النافذة |

الوصول عبر الدالة `rate_limit_consume(p_key, p_limit, p_window_seconds)` التي
تُرجع `(allowed, remaining, retry_after)` وتنفّذ الفحص والتحديث بقفل صف
(`FOR UPDATE`) في عملية واحدة. لا RLS عليه لأنه يُستخدم من السيرفر فقط.

## الدوال المصدرة من `lib/db.ts`

- `getCategories()`
- `getCategoryBySlug(slug)`
- `getCraftsmen()`
- `getCraftsmanBySlug(slug)`
- `getCraftsmenByCategory(slug)`
- `getCategoriesWithCounts()`
- `getAreas()`
- `getStats()`
- `getFeaturedCraftsmen(count, seed?)` — يرتّب الصنايعية بالتفاعل (الأول أعلى
  اتصالات ثم تنوع التخصصات)؛ وإن لم تُسجَّل أي تفاعلات بعد يعود للسلوك العشوائي
  السابق مع تنوع التخصصات.
- `POST /api/stats` — تسجيل حدث `view`/`call`/`whatsapp` لصنايعي منشور عبر
  `increment_craftsman_stat` مع rate limit لكل IP.

## ملاحظات تشغيلية

- صفحة التفاصيل الآن: `/craftsman/[slug]`.
- صورة طلب التسجيل تُحوَّل إلى WebP من المتصفح ثم تُرفع إلى باكت
  `craftsman-images` داخل مسار `requests/`.
- موافقة المشرف على طلب تسجيل تنشئ صفاً جديداً في `craftsmen` وتحدّث حالة
  الطلب إلى `approved` — عبر دالة `approve_join_request(request_id)` التي تنفّذ
  العملية كلها في معاملة واحدة (قفل صف + فحص `pending` + إنشاء الصنايعي بمعالجة
  تعارض slug + تحديث الحالة) لمنع الموافقة المزدوجة.
- RLS لـ `social_links`: القراءة العامة متاحة لروابط الصنايعية المنشورين فقط
  (`is_published = true`).
- فورم "تواصل معنا" في الصفحة الرئيسية يحفظ الرسائل في `contact_messages`
  ويظهرها للمشرف في `/admin/messages` (مقروء/غير مقروء + حذف).
- رفع الصور يتم عبر `/api/storage/sign-upload` (فحص صلاحية ومسار آمن وrate limit
  لكل IP) ثم `uploadToSignedUrl` مباشرة إلى الباكت `craftsman-images` — مسارات
  `requests/` متاحة للزوار و`craftsmen/` للمشرف فقط (فحص جلسة + `is_admin`).
- روابط السوشيال (`social_links`) قابلة للتحرير من نموذج الصنايعي في لوحة التحكم
  (حتى 4 روابط، منصات فريدة، تحقق URL بـ http/https) — عند الحفظ تُعاد كتابتها
  ذرّياً، وتُجلب مع بيانات الصنايعي لتظهر جاهزة للتعديل.
- فورم التسجيل `/join` يسمح بإضافة روابط السوشيال (نفس المحرر المشترك) ويحفظها
  في عمود `join_requests.social_links` (jsonb) — وعند الموافقة تنسخ دالة
  `approve_join_request` الروابط الصالحة إلى جدول `social_links` تلقائياً
  (فلترة المنصات المسموحة + تجاهل الروابط الفارغة).
