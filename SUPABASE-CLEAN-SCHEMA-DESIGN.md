# تصميم Schema نظيف — دليل الصنايعية

> ** HARD STOP — هذا مستند تصميم فقط. لا تنفيذ، لا DROP، لا DELETE، لا migrations.**
>
> آخر تحديث: 2026-09-22

---

## 1. Current Schema Audit

### 1.1 الجداول الحية على Supabase (11 جدول + عرض)

| الجدول | الصفوف | RLS | الحالة |
|--------|--------|-----|--------|
| `categories` | 18 | مفعّل | ✅ نظيف |
| `areas` | 25 | مفعّل | ✅ نظيف |
| `craftsmen` | 44 | مفعّل | ✅ نظيف |
| `social_links` | 16 | مفعّل | ✅ نظيف |
| `craftsman_stats` | 39 | مفعّل | ✅ نظيف |
| `craftsman_events` | 341 | مفعّل | ✅ نظيف |
| `join_requests` | 14 | مفعّل | ⚠️ مدمج (register + report) |
| `contact_messages` | 1 | مفعّل | ✅ نظيف |
| `profiles` | 5 | مفعّل | ✅ نظيف |
| `favorites` | 0 | مفعّل | ✅ نظيف |
| `reviews` | 1 | مفعّل | ✅ نظيف |
| `rate_limits` | 2 | مفعّل | ❌ غير مستخدم من التطبيق |
| `craftsman_rating_summaries` | — | — | ✅ عرض (VIEW) |

### 1.2 الدوال (14)

| الدالة | الوصف | SECURITY DEFINER |EXECUTE |
|--------|-------|:---:|--------|
| `handle_new_user()` | إنشاء profile تلقائياً عند التسجيل | ✅ | trigger فقط |
| `is_admin()` | فحص صلاحية المشرف | ✅ | authenticated |
| `get_my_role()` | إرجاع الدور الحالي | ✅ | authenticated |
| `get_my_craftsman_id()` | إرجاع craftsman_id الخاص بالمستخدم | ✅ | authenticated |
| `link_craftsman_user(uuid, text)` | ربط حساب فني بحساب مستخدم | ✅ | authenticated (admin) |
| `approve_join_request(uuid)` | الموافقة على طلب تسجيل (معالجة كاملة) | ✅ | authenticated (admin) |
| `record_craftsman_event(text,text,text,text,text)` | تسجيل حدث + تحديث عدادات | ✅ | anon + authenticated |
| `get_analytics_overview()` | نظرة عامة تحليلات | ✅ | authenticated (admin) |
| `get_craftsman_favorites_count(uuid)` | عدد المفضلة | ✅ | anon + authenticated |
| `get_craftsman_rating_summary(uuid)` | ملخص التقييم (مرور على VIEW) | ✅ | anon + authenticated |
| `get_related_craftsmen(uuid, integer)` | توصية تعاونية | ✅ | anon + authenticated |
| `guard_craftsman_owner_update()` | حارس: فني يعدّل حقول آمنة فقط | ✅ | trigger فقط |
| `guard_favorite_target()` | حارس: منع حفظ غير المنشور | ✅ | trigger فقط |
| `guard_join_request_update()` | حارس: انتقالات حالة صالحة فقط | ✅ | trigger فقط |
| `guard_review_write()` | حارس: اسم من البروفايل + ثبات الملكية | ✅ | trigger فقط |

### 1.3 العروض (1)

| العرض | تعريف |
|-------|-------|
| `craftsman_rating_summaries` | `craftsman_id`, `average_rating` (round avg 1), `total_reviews` من `reviews GROUP BY craftsman_id` |

### 1.4 المُحفّزات (5 على جداول public)

| المُحفّز | الجدول | الدالة | النوع |
|----------|--------|--------|-------|
| `on_auth_user_created` | auth.users | handle_new_user | AFTER INSERT |
| `trg_craftsman_owner_update_guard` | craftsmen | guard_craftsman_owner_update | BEFORE UPDATE |
| `trg_favorite_target_guard` | favorites | guard_favorite_target | BEFORE INSERT |
| `trg_join_request_update_guard` | join_requests | guard_join_request_update | BEFORE UPDATE |
| `trg_review_write_guard` | reviews | guard_review_write | BEFORE INSERT OR UPDATE |

### 1.5 التخزين

- باكت واحد: `craftsman-images` (عام، حد 5MB)
- مسارات: `requests/` (رفع صور طلبات التسجيل) + `craftsmen/<id>/` (صور البروفايل)
- سياسات: owner read/upload/delete، anon upload requests، admin manage

### 1.6 الامتدادات المُثبّتة

`plpgsql`, `pgcrypto`, `uuid-ossp`, `pg_cron`, `pg_stat_statements`, `supabase_vault`

### 1.7 المهاجرات التاريخية (20 ملفاً محلياً + 3 حية)

الملفات المحلية (2026-08-06 إلى 20260922) + المهاجرات الحية (fix_craftsman_public_read_rls، rls_recovery، rls_recovery_auth_read_contact_messages).

---

## 2. Proposed Business Model

### 2.1 النموذج المُ你也 (كما هو مكتوب في الكود)

```
auth.users ─────────────────────── Supabase Auth (هوية)
    │
    ▼
profiles ──────────────────────── حالة المستخدم التطبيقي
  ├── role: client | craftsman | admin
  ├── craftsman_id ────────────── ربط حساب فني (1:1 حصرية)
  ├── display_name, avatar_name
  │
  ├── [client] ── favorites ──► craftsmen
  │                reviews ────► craftsmen
  │
  ├── [craftsman] ── craftsmen ( صفه ) ──► categories (تصنيف واحد)
  │                                      ──► areas (منطقة واحدة)
  │                       social_links (N صور روابط)
  │                       craftsman_stats (عدادات)
  │                       craftsman_events (أحداث خام)
  │
  └── [admin] ──── كل العمليات الإدارية

categories ────────────────────── التصنيفات (18)
areas ─────────────────────────── المناطق (25)
craftsmen ────────────────────── الصنايعية (44) — core entity
social_links ─────────────────── روابط السوشيال (16)
craftsman_stats ──────────────── عدادات التفاعل (39)
craftsman_events ─────────────── أحداث خام (341)
join_requests ────────────────── طلبات الانضمام فقط
reports ──────────────────────── البلاغات فقط (جديد)
contact_messages ─────────────── رسائل التواصل
```

### 2.2 قواعد Business الأساسية

1. **الزائر** يرى الصنايعية المنشورين والمحتوى العام بدون login.
2. **Login** مطلوب فقط عندما تكون العملية مرتبطة بهوية المستخدم.
3. **المستخدم** يدير مفضلاته وتقييماته وطلباته.
4. **الصنايعي** يدير بياناته الشخصية من لوحة التحكم (حقول محددة).
5. **Admin** يدير كل شيء: الصنايعية، الطلبات، البلاغات، الرسائل، التصنيفات، المناطق.
6. **التقييمات** مرتبطة بالمستخدم (واحد لكل عميل/صنايعي).
7. **المفضلة** مرتبطة بالمستخدم (حذف/إضافة فقط).
8. **طلبات الانضمام** تتطلب login وتعمل كـ "طلب تسجيل" فقط.
9. **البلاغات** متاحة لأي زائر (بيانات اتصال فقط).
10. **الأحداث** raw append-only، الإحصائيات مُجمّعة (stats).

---

## 3. Final Tables

> **11 جدول + 1 عرض** (بدون `rate_limits` وبدون `app_settings`)

| # | الجدول | السبب |
|---|--------|-------|
| 1 | `categories` | تصنيفات الصنايعية |
| 2 | `areas` | المناطق الجغرافية |
| 3 | `craftsman` | الصنايعية — الكيان الرئيسي |
| 4 | `social_links` | روابط السوشيال لكل صنايعي |
| 5 | `craftsman_stats` | عدادات التفاعل المُجمّعة |
| 6 | `craftsman_events` | أحداث خام (append-only) |
| 7 | `join_requests` | طلبات الانضمام فقط (تسجيل) |
| 8 | `reports` | البلاغات فقط (分割 من join_requests) |
| 9 | `contact_messages` | رسائل التواصل العامة |
| 10 | `profiles` | بروفايل المستخدم التطبيقي |
| 11 | `favorites` | مفضلات المستخدمين |
| 12 | `reviews` | تقييمات المستخدمين |
| VIEW | `craftsman_rating_summaries` | ملخص التقييمات (متوسط + عدد) |

**لا نحتاج:**
- `craftsman_categories` — الصنايعي له تصنيف واحد فقط (FK مفرد في craftsmen).
- `craftsman_areas` — الصنايعي يخدم منطقة واحدة فقط (FK مفرد في craftsmen).
- `app_settings` — لا يوجد في الكود أي استعلام لـ settings من قاعدة البيانات. كل الإعدادات مُثبّتة في الكود (CSP، حد الصور، نوافذ Rate Limit).
- `rate_limits` — التطبيق يستخدم rate-limit في الذاكرة (lib/utils/rate-limit.ts). لم يُستخدم هذا الجدول أبداً.

---

## 4. Table-by-Table Schema

### 4.1 `categories`

> التصنيفات الرئيسية (سباك، كهربائي، نجارة...). الكيان المرجعي للتصنيف.

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `slug` | text | — | لا | — | ✅ | slug إنجليزي (plumbing) |
| `name` | text | — | لا | — | — | اسم عربي |
| `icon` | text | — | لا | — | — | اسم أيقونة CategoryIcon |
| `sort_order` | int | — | لا | `0` | — | ترتيب العرض |
| `is_active` | boolean | — | لا | `true` | — | إظهار/إخفاء |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإنشاء |

**Fkeys:** لا يوجد (جدول مرجعي).

**فهارس:** لا حاجة إضافية (18 صف فقط، PK يكفي).

**RLS:**
- القراءة: `TO anon, authenticated USING (true)`
- الكتابة: `TO authenticated USING (is_admin())`

---

### 4.2 `areas`

> المناطق الجغرافية. الكيان المرجعي للمنطقة.

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `name` | text | — | لا | — | ✅ | اسم المنطقة |
| `sort_order` | int | — | لا | `0` | — | ترتيب العرض |
| `is_active` | boolean | — | لا | `true` | — | إظهار/إخفاء |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإنشاء |

**Fkeys:** لا يوجد.

**RLS:**
- القراءة: `TO anon, authenticated USING (true)`
- الكتابة: `TO authenticated USING (is_admin())`

---

### 4.3 `craftsmen`

> الكيان الرئيسي — الصنايعي المنشور. كل شيء يدور حوله.

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `slug` | text | — | لا | — | ✅ | slug فريد للرابط |
| `name` | text | — | لا | — | — | اسم الصنايعي |
| `category_id` | uuid | — | لا | — | — | FK → categories.id ON DELETE RESTRICT |
| `area_id` | uuid | — | لا | — | — | FK → areas.id ON DELETE RESTRICT |
| `image_url` | text | — | **نعم** | — | — | رابط الصورة (Storage أو خارجي) |
| `phone` | text | — | لا | — | — | رقم الهاتف |
| `whatsapp` | text | — | **نعم** | — | — | رقم الواتساب (اختياري) |
| `description` | text | — | **نعم** | — | — | وصف قصير |
| `verified` | boolean | — | لا | `false` | — | هل موثّق؟ (admin only) |
| `added_at` | date | — | لا | `CURRENT_DATE` | — | تاريخ الإضافة |
| `is_published` | boolean | — | لا | `false` | — | يظهر فقط إذا true |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإنشاء |

**Fkeys:**
- `category_id` → `categories(id)` ON DELETE RESTRICT
- `area_id` → `areas(id)` ON DELETE RESTRICT

**فهارس:**
- `craftsmen_category_idx` ON `(category_id, is_published)` — لاستعلام التصنيف
- `craftsmen_area_idx` ON `(area_id)` — لاستعلام المنطقة
- `craftsmen_added_at_idx` ON `(added_at DESC)` — للترتيب

**RLS:**
- القراءة العامة: `TO anon, authenticated USING (is_published = true)`
- قراءة الفني لصفه: `TO authenticated USING (id = get_my_craftsman_id())`
- تعديل الفني: `TO authenticated USING (id = get_my_craftsman_id())` + guard trigger
- تعديل المشرف: `TO authenticated USING (is_admin())`

**ملاحظات:**
- الصنايعي له تصنيف واحد فقط (category_id FK مفرد) — لا حاجة لجدول وسيط.
- الصنايعي يخدم منطقة واحدة فقط (area_id FK مفرد) — لا حاجة لجدول وسيط.
- الحارس `guard_craftsman_owner_update` يمنع الفني من تغيير: verified, is_published, slug, name, category_id.
- politician: `category_id` و `area_id` على `RESTRICT` — لا يمكن حذف تصنيف أو منطقة عليه صنايعية.

---

### 4.4 `social_links`

> روابط السوشيال ميديا لكل صنايعي (1:N — حتى 4 روابط).

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `craftsman_id` | uuid | — | لا | — | — | FK → craftsmen.id ON DELETE CASCADE |
| `platform` | text | — | لا | — | — | CHECK IN ('facebook','instagram','tiktok','other') |
| `url` | text | — | لا | — | — | الرابط الكامل |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإنشاء |

**Fkeys:**
- `craftsman_id` → `craftsmen(id)` ON DELETE CASCADE

**Unique constraint:**
- `(craftsman_id, platform)` — منع تكرار نفس المنصة لنفس الصنايعي

**RLS:**
- القراءة العامة: `TO anon, authenticated USING (EXISTS (SELECT 1 FROM craftsmen WHERE id = craftsman_id AND is_published = true))`
- قراءة الفني لروابطه: `TO authenticated USING (craftsman_id = get_my_craftsman_id())`
- كتابة/تعديل الفني: `TO authenticated USING (craftsman_id = get_my_craftsman_id())`
- تعديل المشرف: `TO authenticated USING (is_admin())`

---

### 4.5 `craftsman_stats`

> عدادات التفاعل المُجمّعة لكل صنايعي (1:1 — صف واحد لكل صنايعي).

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `craftsman_id` | uuid | ✅ | لا | — | — | FK → craftsmen.id ON DELETE CASCADE |
| `views` | int | — | لا | `0` | — | إجمالي مشاهدات الصفحة |
| `calls` | int | — | لا | `0` | — | عدد ضغطات زر الاتصال |
| `whatsapp` | int | — | لا | `0` | — | عدد ضغطات زر الواتساب |
| `updated_at` | timestamptz | — | لا | `now()` | — | آخر تحديث |

**Fkeys:**
- `craftsman_id` → `craftsmen(id)` ON DELETE CASCADE

**RLS:**
- القراءة العامة: `TO anon, authenticated USING (true)`
- قراءة الفني ل إحصائياته: `TO authenticated USING (craftsman_id = get_my_craftsman_id())`
- الكتابة: عبر `record_craftsman_event` فقط (SECURITY DEFINER)

**ملاحظات:**
- **لا يُحذف عندما يُحذف الصنايعي** (CASCADE من craftsman) — جيد.
- يُحدَّث فقط عبر `record_craftsman_event` (الدالة تفعل upsert).
- الكود يقرأه مباشرة من craftsman_stats عبر PostgREST (قائمة الكروت + لوحة التحكم).

---

### 4.6 `craftsman_events`

> أحداث خام (append-only) — مصدر كل الإحصائيات.

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | bigint | ✅ | لا | `GENERATED ALWAYS AS IDENTITY` | — | PK |
| `event_type` | text | — | لا | — | — | CHECK IN ('page_view','call_click','whatsapp_click') |
| `craftsman_id` | uuid | — | لا | — | — | FK → craftsmen.id ON DELETE CASCADE |
| `device_key` | text | — | لا | — | — | SHA-256 لـ ip\|deviceId |
| `session_id` | text | — | لا | — | — | معرّف الجلسة |
| `path` | text | — | لا | `''` | — | المسار |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت التسجيل |

**Fkeys:**
- `craftsman_id` → `craftsmen(id)` ON DELETE CASCADE

**فهارس:**
- `craftsman_events_created_at_idx` ON `(created_at DESC)` — للنافذة الزمنية
- `craftsman_events_craftsman_idx` ON `(craftsman_id, created_at DESC)` — لاستعلام صنايعي
- `craftsman_events_session_idx` ON `(session_id)` — لحساب التحويل والتوصية التعاونية

**RLS:**
- مفعّل بدون سياسات — الكتابة عبر `record_craftsman_event` (SECURITY DEFINER)، القراءة عبر `get_analytics_overview` (مشرف فقط).

**ملاحظات:**
- append-only — لا تعديل ولا حذف.
- `device_key` = SHA-256(`ip|deviceId`) — مجهول الهوية.
- `session_id` من `sessionStorage` — ثابت حتى إغلاق التبويب.

---

### 4.7 `join_requests` (بعد الفصل — تسجيل فقط)

> طلبات الانضمام (تسجيل صنايعي جديد فقط). **لا بلاغات.**

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `name` | text | — | لا | — | — | اسم الصنايعي |
| `category_id` | uuid | — | لا | — | — | FK → categories.id ON DELETE SET NULL |
| `area_id` | uuid | — | لا | — | — | FK → areas.id ON DELETE SET NULL |
| `phone` | text | — | لا | — | — | رقم التواصل |
| `whatsapp` | text | — | **نعم** | — | — | واتساب اختياري |
| `description` | text | — | **نعم** | — | — | وصف قصير |
| `image_url` | text | — | **نعم** | — | — | صورة مرفوعة (Storage) |
| `social_links` | jsonb | — | لا | `'[]'::jsonb` | — | روابط السوشيال [{platform, url}] |
| `status` | text | — | لا | `'pending'` | — | CHECK IN ('pending','approved','rejected') |
| `user_id` | uuid | — | **نعم** | — | — | FK → auth.users.id ON DELETE SET NULL |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإنشاء |
| `updated_at` | timestamptz | — | لا | `now()` | — | آخر تحديث (trigger) |

**Fkeys:**
- `category_id` → `categories(id)` ON DELETE SET NULL
- `area_id` → `areas(id)` ON DELETE SET NULL
- `user_id` → `auth.users(id)` ON DELETE SET NULL

**Unique constraint (جزئي):**
- `(user_id) WHERE type = 'register' AND status = 'pending' AND user_id IS NOT NULL` — طلب تسجيل معلق واحد لكل مقدم.

**فهارس:**
- `join_requests_status_idx` ON `(status)` — لتصفية الطلبات

**RLS:**
- الإدراج: `TO authenticated WITH CHECK (user_id = auth.uid())`
- قراءة المقدم: `TO authenticated USING (user_id = auth.uid())`
- قراءة المشرف: `TO authenticated USING (is_admin())`
- تعديل المشرف: `TO authenticated USING (is_admin())`
- حذف المشرف: `TO authenticated USING (is_admin())`

**Trigger:**
- `trg_join_request_update_guard` (BEFORE UPDATE): منع تغيير النوع/الهوية، انتقالات حالة صالحة فقط (pending → approved/rejected)، updated_at تلقائي.

**ملاحظات:**
- **لا عمود `type`** — الجدول مخصص للتسجيل فقط.
- المشرف يوافق عبر `approve_join_request(p_request_id uuid)` التي تنشئ صفاً في `craftsmen` وتحديث الحالة.
- الصور تُرفع إلى Storage مسار `requests/` ثم تُنسخ إلى `craftsmen/<id>/` عند الموافقة.

---

### 4.8 `reports` (جديد — مُنقّى من join_requests)

> بلاغات الزوار (تصحيح بيانات / إبلاغ عن مشكلة).

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `craftsman_name` | text | — | لا | — | — | اسم الصنايعي المُبلّغ عنه |
| `phone` | text | — | لا | — | — | رقم التواصل |
| `message` | text | — | لا | — | — | وصف المشكلة |
| `status` | text | — | لا | `'pending'` | — | CHECK IN ('pending','reviewed','dismissed') |
| `reporter_user_id` | uuid | — | **نعم** | — | — | FK → auth.users.id ON DELETE SET NULL (إن كان مسجلاً) |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإنشاء |
| `updated_at` | timestamptz | — | لا | `now()` | — | آخر تحديث |

**Fkeys:**
- `reporter_user_id` → `auth.users(id)` ON DELETE SET NULL

**RLS:**
- الإدراج (عام): `TO anon, authenticated USING (true)` — أي زائر يُبلّغ.
- القراءة: `TO authenticated USING (is_admin())` — المشرف فقط.
- التعديل: `TO authenticated USING (is_admin())` — المشرف فقط.
- الحذف: `TO authenticated USING (is_admin())` — المشرف فقط.

**Trigger:**
- `trg_report_update_guard` (BEFORE UPDATE): انتقالات حالة صالحة فقط (pending → reviewed/dismissed)، updated_at تلقائي.

**ملاحظات:**
- **لا صور** — البلاغات نصية فقط (رسالة + رقم تواصل).
- **لا حساب مستخدم مطلوب** — الزائر المجهول يُبلّغ ببساطة.
- **لا艺术品 حيوي** — لا إنشاء صنايعي ولا تعديل أي بيانات.
- `status` يستخدم قيم `pending/reviewed/dismissed` (ليست approved/rejected لأن البلاغ لا يُنشئ شيئاً).

---

### 4.9 `contact_messages`

> رسائل صفحة "تواصل معنا".

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `name` | text | — | لا | — | — | اسم المرسل |
| `phone` | text | — | لا | — | — | رقم الهاتف |
| `message` | text | — | لا | — | — | نص الرسالة |
| `is_read` | boolean | — | لا | `false` | — | مقروءة/غير مقروءة |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإرسال |

**Fkeys:** لا يوجد.

**فهارس:**
- `contact_messages_created_at_idx` ON `(created_at DESC)`
- `contact_messages_is_read_idx` ON `(is_read)` — لتصفية غير المقروءة

**RLS:**
- الإدراج (عام): `TO anon, authenticated USING (true)`
- القراءة: `TO authenticated USING (is_admin())`
- التعديل: `TO authenticated USING (is_admin())`
- الحذف: `TO authenticated USING (is_admin())`

---

### 4.10 `profiles`

> بروفايل المستخدم التطبيقي — يكمل `auth.users` ببيانات التطبيق.

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | — | — | FK → auth.users.id ON DELETE CASCADE |
| `role` | text | — | لا | `'client'` | — | CHECK IN ('client','craftsman','admin') |
| `craftsman_id` | uuid | — | **نعم** | — | ✅ (جزئي) | FK → craftsmen.id ON DELETE SET NULL |
| `display_name` | text | — | **نعم** | — | — | اسم المستخدم الظاهر |
| `avatar_url` | text | — | **عم** | — | — | صورة المستخدم |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإنشاء |

**Fkeys:**
- `id` → `auth.users(id)` ON DELETE CASCADE
- `craftsman_id` → `craftsmen(id)` ON DELETE SET NULL

**Unique constraint (جزئي):**
- `(craftsman_id) WHERE craftsman_id IS NOT NULL` — صنايعي واحد ← بروفايل واحد (ملكية حصرية).

**RLS:**
- قراءة الذات: `TO authenticated USING (auth.uid() = id)`
- قراءة المشرف: `TO authenticated USING (is_admin())`
- تعديل المشرف: `TO authenticated USING (is_admin())`
- **لا سياسة UPDATE للمستخدم العادي** — لا يمكنه تغيير ملكيته بنفسه.

**Trigger:**
- `on_auth_user_created` (AFTER INSERT ON auth.users): `handle_new_user()` — ينشئ profile بـ role='client'.

---

### 4.11 `favorites`

> مفضلات المستخدمين (إضافة/حذف فقط — لا تعديل).

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `user_id` | uuid | — | لا | — | — | FK → auth.users.id ON DELETE CASCADE |
| `craftsman_id` | uuid | — | لا | — | — | FK → craftsmen.id ON DELETE CASCADE |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت الإضافة |

**Fkeys:**
- `user_id` → `auth.users(id)` ON DELETE CASCADE
- `craftsman_id` → `craftsmen(id)` ON DELETE CASCADE

**Unique constraint:**
- `(user_id, craftsman_id)` — مفضلة واحدة فقط لكل زوج.

**فهارس:**
- `favorites_user_idx` ON `(user_id)` — جلب مفضلات مستخدم
- `favorites_craftsman_idx` ON `(craftsman_id)` — عدد المفضلة

**RLS:**
- قراءة الذات: `TO authenticated USING (auth.uid() = user_id)`
- الإضافة: `TO authenticated WITH CHECK (auth.uid() = user_id)`
- الحذف: `TO authenticated USING (auth.uid() = user_id)`
- **لا سياسة UPDATE** — المفضلة تُنشأ أو تُحذف فقط.

**Trigger:**
- `trg_favorite_target_guard` (BEFORE INSERT): منع حفظ صنايعي غير منشور.

---

### 4.12 `reviews`

> تقييمات المستخدمين للصنايعية.

| العمود | النوع | PK | Nullable | Default | Unique | ملاحظات |
|--------|-------|:--:|:--------:|---------|:------:|---------|
| `id` | uuid | ✅ | لا | `gen_random_uuid()` | — | PK |
| `craftsman_id` | uuid | — | لا | — | — | FK → craftsmen.id ON DELETE CASCADE |
| `user_id` | uuid | — | لا | — | — | FK → auth.users.id ON DELETE CASCADE |
| `user_name` | text | — | لا | `'عميل'` | — | **يُشتق من profiles (trigger)** |
| `rating` | smallint | — | لا | — | — | CHECK (1-5) |
| `comment` | text | — | **نعم** | — | — | CHECK (≤500 chars) |
| `created_at` | timestamptz | — | لا | `now()` | — | وقت النشر |
| `updated_at` | timestamptz | — | لا | `now()` | — | آخر تعديل (trigger) |

**Fkeys:**
- `craftsman_id` → `craftsmen(id)` ON DELETE CASCADE
- `user_id` → `auth.users(id)` ON DELETE CASCADE

**Unique constraint:**
- `(user_id, craftsman_id)` — تقييم واحد لكل عميل/صنايعي.

**فهارس:**
- `reviews_craftsman_idx` ON `(craftsman_id)` — جلب تقييمات صنايعي

**RLS:**
- القراءة العامة: `TO anon, authenticated USING (true)`
- الإضافة: `TO authenticated WITH CHECK (auth.uid() = user_id)`
- التعديل: `TO authenticated USING (auth.uid() = user_id)`
- الحذف: `TO authenticated USING (auth.uid() = user_id)`

**Trigger:**
- `trg_review_write_guard` (BEFORE INSERT OR UPDATE): اسم المقيّم من البروفايل دائماً، منع تغيير الملكية/الصنايعي، updated_at تلقائي.

---

### 4.13 `craftsman_rating_summaries` (VIEW)

> ملخص التقييمات — مصدر واحد للحقيقة للمتوسط وعدد التقييمات.

```sql
CREATE VIEW craftsman_rating_summaries AS
SELECT
  craftsman_id,
  ROUND(AVG(rating), 1)::double precision AS average_rating,
  COUNT(*)::integer AS total_reviews
FROM reviews
GROUP BY craftsman_id;
```

**RLS:** يرث من `reviews` (القراءة عامة).

**ملاحظات:**
- `average_rating` يكون `NULL` عند غياب التقييمات (لا 5.0 وهمية).
- الكود يتعامل مع NULL عبر `Number(data.average_rating) || 0`.

---

## 5. Relationships

```
auth.users
  └── 1:1 ── profiles (id FK, CASCADE)
                    ├── craftsman_id FK ──► craftsmen (1:1 حصرية, SET NULL)
                    │
                    ├── [role=client]
                    │     ├── favorites.user_id ──► craftsmen (M:N)
                    │     └── reviews.user_id ──► craftsmen (M:N)
                    │
                    └── [role=craftsman] → craftsmen ( صف واحد )

craftsmen
  ├── N:1 ── categories (category_id FK, RESTRICT)
  ├── N:1 ── areas (area_id FK, RESTRICT)
  ├── 1:N ── social_links (craftsman_id FK, CASCADE)
  ├── 1:1 ── craftsman_stats (craftsman_id FK, CASCADE)
  ├── 1:N ── craftsman_events (craftsman_id FK, CASCADE)
  └── 1:N ── reviews (craftsman_id FK, CASCADE)

categories ── 1:N ── join_requests (category_id FK, SET NULL)
areas ── 1:N ── join_requests (area_id FK, SET NULL)

auth.users
  └── 1:N ── favorites (user_id FK, CASCADE)
  └── 1:N ── reviews (user_id FK, CASCADE)
  └── 1:N ── join_requests (user_id FK, SET NULL)
  └── 1:N ── reports (reporter_user_id FK, SET NULL)
```

**ملخص العلاقات:**

| العلاقة | نوع | FK | ON DELETE |
|---------|-----|-----|-----------|
| profiles → auth.users | 1:1 | profiles.id → auth.users.id | CASCADE |
| profiles → craftsmen | 1:1 (جزئي) | profiles.craftsman_id → craftsmen.id | SET NULL |
| craftsmen → categories | N:1 | craftsmen.category_id → categories.id | RESTRICT |
| craftsmen → areas | N:1 | craftsmen.area_id → areas.id | RESTRICT |
| social_links → craftsmen | N:1 | social_links.craftsman_id → craftsmen.id | CASCADE |
| craftsman_stats → craftsmen | 1:1 | craftsman_stats.craftsman_id → craftsmen.id | CASCADE |
| craftsman_events → craftsmen | N:1 | craftsman_events.craftsman_id → craftsmen.id | CASCADE |
| favorites → auth.users | N:1 | favorites.user_id → auth.users.id | CASCADE |
| favorites → craftsmen | N:1 | favorites.craftsman_id → craftsmen.id | CASCADE |
| reviews → auth.users | N:1 | reviews.user_id → auth.users.id | CASCADE |
| reviews → craftsmen | N:1 | reviews.craftsman_id → craftsmen.id | CASCADE |
| join_requests → categories | N:1 | join_requests.category_id → categories.id | SET NULL |
| join_requests → areas | N:1 | join_requests.area_id → areas.id | SET NULL |
| join_requests → auth.users | N:1 | join_requests.user_id → auth.users.id | SET NULL |
| reports → auth.users | N:1 | reports.reporter_user_id → auth.users.id | SET NULL |

---

## 6. Status Strategy

### 6.1 `join_requests.status`

```
pending ──► approved  (إنشاء صنايعي + ربط بحساب)
pending ──► rejected  (رفض الطلب)
```

- **pending**: الطلب قيد المراجعة (الحالة الافتراضية).
- **approved**: وافق المشرف → تُنشأ بطاقة صنايعي.
- **rejected**: رفض المشرف → لا يُنشأ شيء.
- **لا حالة إلغاء** — المقدم لا يُلغي بنفسه (Admin فقط).
- **الحالات النهائية لا تُعاد فتحها** — guard trigger.

**القيم:** `pending`, `approved`, `rejected`

**CHECK constraint:** `status IN ('pending', 'approved', 'rejected')`

### 6.2 `reports.status`

```
pending ──► reviewed   (تمت المراجعة)
pending ──► dismissed  (تم التخلي عنه)
```

- **pending**: البلاغ قيد المراجعة.
- **reviewed**: تمت المراجعة (action taken أو no action needed).
- **dismissed**: تم التخلي عنه (بلاغ غير صحيح أو مكرر).
- **الحالات النهائية لا تُعاد فتحها** — guard trigger.
- **لا☵ `approved`/`rejected`** — البلاغ لا يُنشئ شيئاً، لا 값 approval.

**القيم:** `pending`, `reviewed`, `dismissed`

**CHECK constraint:** `status IN ('pending', 'reviewed', 'dismissed')`

### 6.3 لماذا فصل statuses:

- `join_requests` → **عملية إنشاء** (الموافقة تنشئ صنايعي). Lifecycle مرتبط بالalım.
- `reports` → **عملية مراجعة** (البلاغ لا يُنشئ شيئاً). Lifecycle مستقل.
- لا `statuses` مشترك — كل domain يحتفظ بحالاته الخاصة.

---

## 7. Settings Strategy

> **لا نحتاج `app_settings` حاليًا.**

**المبرر:**
- لا يوجد في الكود أي استعلام لـ settings من قاعدة البيانات.
- كل الإعدادات مُثبّتة في الكود:
  - حد حجم الصورة: `MAX_IMAGE_SIZE_MB = 5` (lib/storage/images.ts)
  - جودة WebP: `WEBP_QUALITY = 0.8` (lib/storage/images.ts)
  - نافذة Rate Limit: `60/دقيقة/IP` (app/api/stats/route.ts)
  - CSP policies (next.config.mjs)
  - أنواع الصور المقبولة (lib/storage/images.ts)

**إذا احتجنا settings مستقبلاً:**
- ننشئ `app_settings` بعمود `key` (text UNIQUE) وعمود `value` (jsonb).
- أو نستخدم Supabase Edge Functions Configuration.
- هذا قرار مؤجل لا يؤثر على التصميم الحالي.

---

## 8. Events / Analytics Strategy

### 8.1 طبقة الأحداث الخام (`craftsman_events`)

- **Append-only** — لا تعديل ولا حذف.
- كل حدث يمثل تفاعلاً واحداً: `page_view`, `call_click`, `whatsapp_click`.
- `device_key` = SHA-256(`ip|deviceId`) — يُستخدم لحساب الزوار الفريدين.
- `session_id` من `sessionStorage` — يُستخدم لحساب معدل التحويل.
- `path` — المسار الذي جاء منه الحدث.

**التدفق:**
```
ViewTracker / ContactActions
  → POST /api/stats (Next.js API)
    → rateLimitConsume (in-memory, 60/min/IP)
    → record_craftsman_event (RPC, SECURITY DEFINER)
      → INSERT INTO craftsman_events
      → UPSERT craftsman_stats (views/calls/whatsapp++)
```

### 8.2 طبقة الإحصائيات المُجمّعة (`craftsman_stats`)

- **1:1 مع craftsmen** — صف واحد لكل صنايعي.
- `views` = إجمالي مشاهدات الصفحة (يُحسب عند كل تحميل — لا يوجد منع يومي).
- `calls` = عدد ضغطات زر الاتصال.
- `whatsapp` = عدد ضغطات زر الواتساب.
- يُحدَّث فقط عبر `record_craftsman_event` (SECURITY DEFINER).

**لماذا نحتفظ بـ `craftsman_stats`؟**
- **الأداء:** الاستعلام المباشر من `craftsman_events` (341+ صف + COUNT/DISTINCT) أبطأ بكثير من قراءة صف واحد في `craftsman_stats`.
- **الكروت:** `getFeaturedCraftsmen` يحتاج `views/calls/whatsapp` لكل صنايعي — query واحد بدل N queries.
- **لوحة التحكم:** `getCraftsmanDashboardData` يحتاج نفس البيانات — query واحد.
- **التوصية:** `getRecommendationPool` يحتاج `views/calls/whatsapp` لحساب engagement score.
- **البيانات المُجمّعة لا تُعدّل يدوياً** — لا يوجد update مباشر على stats.

### 8.3 الإحصائيات التحليلية (`get_analytics_overview`)

- **متاح فقط للمشرف** — `get_analytics_overview()` (SECURITY DEFINER + is_admin check).
- يقرأ من `craftsman_events` مباشرة (ليس من stats).
- يحسب: `todayUsers` (زوار اليوم الفريدون)، `weekUsers`، `todayPageviews`، `weekPageviews`، `viewSessions`، `contactSessions`، `conversionRate`.

---

## 9. RLS / Authorization Model

### 9.1 الأدوار

| الدور | القيمة | الوصول الأساسي |
|-------|--------|----------------|
| زائر | (anon) | قراءة المحتوى العام فقط |
| مستخدم عادي | `client` | + مفضلاته + تقييماته + طلباته + بلاغه |
| فني | `craftsman` | + إدارة صفه (حقول محددة) |
| مشرف | `admin` | كل شيء |

### 9.2 نمط السياسات (TO roles)

**القاعدة الأساسية:** السياسات المُستدعة لدوال auth (is_admin, get_my_craftsman_id) تكون دائماً `TO authenticated` — **لا** `TO anon, authenticated` — حتى لا تُستدعى الدالة من anon وتُفشل بـ 42501.

| نوع الوصول | TO | USING / WITH CHECK |
|------------|-----|---------------------|
| قراءة عامة (categories, areas, craftsmen published, social_links published, craftsman_stats, reviews) | `anon, authenticated` | `true` أو شرط بسيط |
| قراءة ملكية (craftsmen own, social_links own, stats own, favorites own, reviews own) | `authenticated` | `id = get_my_craftsman_id()` أو `user_id = auth.uid()` |
| إدراج عام (contact_messages, reports) | `anon, authenticated` | `true` |
| إدراج مسجل (favorites, reviews, join_requests) | `authenticated` | `auth.uid() = user_id` |
| تعديل/حذف ملكي | `authenticated` | `auth.uid() = user_id` |
| إداري (كل الجداول الإدارية) | `authenticated` | `is_admin()` |

### 9.3 ملخص السياسات

| الجدول | anon SELECT | auth SELECT | anon INSERT | auth INSERT | auth UPDATE | auth DELETE |
|--------|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|:-----------:|
| categories | ✅ | ✅ | — | admin | admin | admin |
| areas | ✅ | ✅ | — | admin | admin | admin |
| craftsmen | published | published + own + admin | — | admin | admin + own(safe) | admin |
| social_links | published | published + own + admin | — | admin + own | admin + own | admin + own |
| craftsman_stats | ✅ | ✅ + own | — | — | — | — |
| join_requests | — | own + admin | — | auth(user_id=uid) | admin | admin |
| reports | — | admin | ✅ | ✅ | admin | admin |
| contact_messages | — | admin | ✅ | ✅ | admin | admin |
| profiles | — | own + admin | — | — | admin | — |
| favorites | — | own | — | auth(uid) | — | auth(uid) |
| reviews | ✅ | ✅ | — | auth(uid) | auth(uid) | auth(uid) |

---

## 10. Functions / Views / Triggers

### 10.1 الدوال (بعد التنظيف)

| الدالة | التوقيع | الوصف | EXECUTE |
|--------|---------|-------|---------|
| `is_admin()` | `() → boolean` | فحص role='admin' | authenticated |
| `get_my_role()` | `() → text` | إرجاع الدور | authenticated |
| `get_my_craftsman_id()` | `() → uuid` | إرجاع craftsman_id | authenticated |
| `handle_new_user()` | `() → trigger` | إنشاء profile جديد | trigger فقط |
| `link_craftsman_user(uuid, text)` | `(craftsman_id, email) → boolean` | ربط حساب فني (admin) | authenticated |
| `approve_join_request(uuid)` | `(request_id) → uuid` | موافقة على طلب تسجيل (admin) | authenticated |
| `record_craftsman_event(text,text,text,text,text)` | `(slug, metric, device_key, session_id, path) → boolean` | تسجيل حدث + تحديث stats | anon + authenticated |
| `get_analytics_overview()` | `() → json` | نظرة عامة تحليلات (admin) | authenticated |
| `get_craftsman_favorites_count(uuid)` | `(craftsman_id) → integer` | عدد المفضلة | anon + authenticated |
| `get_craftsman_rating_summary(uuid)` | `(craftsman_id) → TABLE(average_rating, total_reviews)` | ملخص التقييم | anon + authenticated |
| `get_related_craftsmen(uuid, integer)` | `(craftsman_id, limit) → TABLE(...)` | توصية تعاونية | anon + authenticated |

**الدوال المُستبعدة:**
- `rate_limit_consume(text, int, int)` — تُستخدم من كود السيرفر فقط (in-memory rate limit يكفي).

### 10.2 الحرس (Trigger Functions — لا EXECUTE عام)

| الدالة | الجدول | النوع | الوصف |
|--------|--------|-------|-------|
| `guard_craftsman_owner_update()` | craftsmen | BEFORE UPDATE | يمنع الفني من تغيير الحقول الإدارية |
| `guard_favorite_target()` | favorites | BEFORE INSERT | يمنع حفظ صنايعي غير منشور |
| `guard_join_request_update()` | join_requests | BEFORE UPDATE | يفرض انتقالات حالة صالحة + updated_at |
| `guard_review_write()` | reviews | BEFORE INSERT OR UPDATE | اسم من البروفايل + ثبات الملكية + updated_at |
| `guard_report_update()` | reports | BEFORE UPDATE | يفرض انتقالات حالة صالحة + updated_at |

### 10.3 العروض

| العرض | تعريف | RLS |
|-------|-------|-----|
| `craftsman_rating_summaries` | `GROUP BY craftsman_id` من reviews → (average_rating, total_reviews) | يرث من reviews |

### 10.4 المُحفّزات

| المُحفّز | الجدول | الدالة | النوع |
|----------|--------|--------|-------|
| `on_auth_user_created` | auth.users | handle_new_user | AFTER INSERT |
| `trg_craftsman_owner_update_guard` | craftsmen | guard_craftsman_owner_update | BEFORE UPDATE |
| `trg_favorite_target_guard` | favorites | guard_favorite_target | BEFORE INSERT |
| `trg_join_request_update_guard` | join_requests | guard_join_request_update | BEFORE UPDATE |
| `trg_review_write_guard` | reviews | guard_review_write | BEFORE INSERT OR UPDATE |
| `trg_report_update_guard` | reports | guard_report_update | BEFORE UPDATE |

---

## 11. Old → New Data Mapping

### 11.1 جداول لا تتغير (KEEP — نسخ مباشر)

| OLD | NEW | التعديل |
|-----|-----|---------|
| `categories` | `categories` | لا شيء — نسخ مباشر |
| `areas` | `areas` | لا شيء — نسخ مباشر |
| `craftsmen` | `craftsmen` | لا شيء — نسخ مباشر |
| `social_links` | `social_links` | لا شيء — نسخ مباشر |
| `craftsman_stats` | `craftsman_stats` | لا شيء — نسخ مباشر |
| `craftsman_events` | `craftsman_events` | لا شيء — نسخ مباشر |
| `contact_messages` | `contact_messages` | لا شيء — نسخ مباشر |
| `profiles` | `profiles` | لا شيء — نسخ مباشر |
| `favorites` | `favorites` | لا شيء — نسخ مباشر |
| `reviews` | `reviews` | لا شيء — نسخ مباشر |
| `craftsman_rating_summaries` | `craftsman_rating_summaries` | لا شيء — إعادة إنشاء VIEW |

### 11.2 جدول `join_requests` → فصل إلى `join_requests` + `reports`

**الخطوة 1:** إنشاء جدول `reports` جديد.

**الخطوة 2:** نقل البلاغات الحالية:

```sql
INSERT INTO reports (id, craftsman_name, phone, message, status, created_at, updated_at)
SELECT
  id,
  craftsman_name,
  phone,
  report_message,
  CASE status
    WHEN 'approved' THEN 'reviewed'
    WHEN 'rejected' THEN 'dismissed'
    ELSE 'pending'
  END,
  created_at,
  updated_at
FROM join_requests
WHERE type = 'report';
```

**الخطوة 3:** حذف البلاغات القديمة من join_requests:

```sql
DELETE FROM join_requests WHERE type = 'report';
```

**الخطوة 4:** حذف عمود `type` من join_requests (أو تغييره):

```sql
ALTER TABLE join_requests DROP COLUMN type;
```

**الخطوة 5:** إعادة بناء القيد الجزئي الفريد (بدون `type`):

```sql
DROP INDEX IF EXISTS join_requests_pending_register_unique;
CREATE UNIQUE INDEX join_requests_pending_register_unique
  ON join_requests (user_id)
  WHERE status = 'pending' AND user_id IS NOT NULL;
```

### 11.3 جدول `rate_limits` → DROP

```sql
DROP TABLE IF EXISTS rate_limits;
DROP FUNCTION IF EXISTS rate_limit_consume(text, int, int);
```

### 11.4 ملخص النقل

| OLD | NEW | الإجراء |
|-----|-----|---------|
| `join_requests.type='register'` | `join_requests` | الاحتفاظ + حذف عمود type |
| `join_requests.type='report'` | `reports` | نقل + تحويل status |
| `rate_limits` | — | حذف |

---

## 12. Migration Strategy

### 12.1 المبدأ

- **لا تعديل migrations تاريخية** — الملفات القديمة تبقى كمرجع.
- **migration جديدة واحدة** (أو سلسلة مترتبة) تُطبَّق على الـ DB الحي.
- **idempotent** — يمكن تشغيلها عدة مرات بأمان.
- **لا حذف بيانات** — النقل آمن مع تحويل الحالة.

### 12.2 الترتيب المقترح للـ Migrations

```
1. CREATE TABLE reports (بنية جديدة)
2. INSERT INTO reports ... FROM join_requests WHERE type='report'
3. DELETE FROM join_requests WHERE type='report'
4. ALTER TABLE join_requests DROP COLUMN type
5. DROP INDEX join_requests_pending_register_unique
6. CREATE UNIQUE INDEX join_requests_pending_register_unique (بدون type)
7. CREATE TRIGGER trg_report_update_guard ON reports
8. CREATE POLICY ... ON reports
9. GRANT SELECT/INSERT/UPDATE/DELETE ON reports TO anon/authenticated
10. DROP TABLE rate_limits
11. DROP FUNCTION rate_limit_consume
12. REVOKE ALL ON FUNCTION rate_limit_consume FROM PUBLIC
```

### 12.3 تسجيل الأخطاء

- **التحقق المسبق:** قبل كل migration، فحص هل البيانات الحية متوافقة (مثل: هل توجد بلاغات؟ هل يوجد rate_limits؟).
- **رسائل واضحة:** إذا فشل الشرط المسبق → رسالة خطأ واضحة + لا حذف/تعديل بيانات.

---

## 13. Tables / Columns / Functions to Retire

### 13.1 جداول تُحذف

| الجدول | السبب |
|--------|-------|
| `rate_limits` | غير مستخدم من التطبيق — Rate Limit في الذاكرة |

### 13.2 أعمدة تُحذف

| الجدول | العمود | السبب |
|--------|--------|-------|
| `join_requests` | `type` | لا حاجة — الجدول مخصص للتسجيل فقط |
| `join_requests` | `craftsman_name` | انتقل إلى `reports` |
| `join_requests` | `report_message` | انتقل إلى `reports` (أصبح `message`) |

### 13.3 دوال تُحذف

| الدالة | السبب |
|--------|-------|
| `rate_limit_consume(text, int, int)` | غير مستخدمة — Rate Limit في الذاكرة |

### 13.4 فهارس تُحذف/إعادة بناء

| الفهرس | الإجراء |
|--------|---------|
| `join_requests_pending_register_unique` | إعادة بناء (بدون `type` في الشرط) |
| `join_requests_status_idx` | يبقى كما هو |

---

## 14. Open Business Decisions

### 14.1 قرارات مفتوحة (تتطلب رد فعل)

| # | السؤال | الوضع الحالي | المقترح |
|---|--------|-------------|---------|
| 1 | **هل نفصل `reports` فعلياً أم نُبقي `type='report'` في `join_requests`؟** | مدمج حاليًا | الفصل أفضل: lifecycle وdata وRLS مختلفة تماماً |
| 2 | **هل نحذف `rate_limits` أم نحتفظ به للنشر المتعدد؟** | غير مستخدم | حذف — الـ in-memory يكفي حاليًا |
| 3 | **هل نحتاج `app_settings` مستقبلاً؟** | لا يوجد | لا — كل الإعدادات في الكود. نُؤجله |
| 4 | **هل نضيف `updated_at` على `craftsmen`؟** | لا يوجد | يُضاف trigger `set_updated_at` — مفيد للتدقيق |
| 5 | **هل نضيف `updated_at` على `contact_messages`؟** | لا يوجد | لا — لا يوجد تعديل من المستخدم |
| 6 | **هل ن移除 عمود `user_name` من `reviews`؟** | يُشتق من trigger | لا — يبقى مفيداً للعرض السريع بدون JOIN |
| 7 | **هل نضيف `reported_craftsman_id` على `reports`؟** | لا يوجد (isim فقط) | يُضاف اختيارياً لربط البلاغ بالصنايعي مباشرة |
| 8 | **هل نحتاج `deleted_at` (soft delete) على `craftsmen`؟** | لا يوجد | لا — الحذف الفعلي + CASCADE يكفي |
| 9 | **إذا احتجنا صنايعي يخدم أكثر من منطقة مستقبلاً؟** | FK مفرد | إعادة بناء مع `craftsman_areas` — مؤجل |

### 14.2 ملاحظات تقنية

1. **`database.types.ts`** يجب إعادة توليده بعد تغيير الـ Schema ( عبر `supabase gen types typescript`).
2. **الكود الحالي** يستخدم `type` في `join_requests` في `admin.ts` — يجب تحديثه ليعمل مع `reports` المنفصلة.
3. **الppoxy.ts** و `hooks/auth/` لا تحتاج تغيير — الأدوار والحماية لا تتغير.
4. **storage policies** لا تتغير — المسارات (`requests/`, `craftsmen/<id>/`) تبقى كما هي.

---

> ** HARD STOP — هذا المستند يصف التصميم فقط. بعد مراجعتك واعتمادك للـ Schema، نبدأ التنفيذ مرحلة بمرحلة.**
