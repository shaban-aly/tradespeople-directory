# دليل أوامر Impeccable — خطة المرور على الموقع صفحة صفحة 🚀
> **دليل الصنايعية (The Suez Digital Guild)**  
> مسار عمل تفاعلي شامل لمراجعة، تدقيق، وتطوير كافة واجهات الموقع بالترتيب وفق نظام التصميم المعتمد (`DESIGN.md` و`PRODUCT.md`).

---

## 📌 كيف تستخدم هذا الدليل؟
- انسخ الأمر الخاص بالصفحة أو القسم وأرسله لي في المحادثة مباشرة.
- الترتيب مقسم إلى **4 مراحل منطقية** تبدأ بالصفحات الأكثر تأثيراً على تجربة الزائر وتنتهي بلوحات التحكم.
- لكل صفحة 3 خطوات نموذجية:
  1. **التشخيص أولاً** (`critique` أو `audit`).
  2. **التحسين المركز** (`colorize` للألوان / `typeset` للخطوط / `layout` للتخطيط).
  3. **الصقل النهائي** (`polish`) قبل الانتقال للصفحة التالية.

---

## 🧭 المرحلة الأولى: صفحات الزائر الأساسية (Public Core)

### 1. الصفحة الرئيسية (Home Page)
> الواجهة الأساسية التي تستقبل أهالي السويس وتوجههم فوراً للبحث أو الطلب.

* **تقييم الواجهة وتجربة المستخدم كاملة**:
  ```text
  /impeccable critique app/(site)/page.tsx
  ```
* **صقل كروت الصنايعية الموثقين (Verified Craftsmen)**:
  ```text
  /impeccable polish components/home/VerifiedCraftsmen.tsx
  ```
* **ضبط التخطيط والتباعد لكروت التوصيات (Recommendations)**:
  ```text
  /impeccable layout components/home/RecommendationsPanel.tsx
  ```
* **صقل السايد بار الجديد للتصنيفات على الديسكتوب**:
  ```text
  /impeccable polish components/home/CategoriesSidebar.tsx
  ```
* **صقل سكشن "إزاي بيشتغل الموقع" (How It Works)**:
  ```text
  /impeccable polish components/home/HowItWorksSection.tsx
  ```

---

### 2. صفحة بروفايل الصنايعي (Craftsman Profile)
> الصفحة الحاسمة لاتخاذ قرار الاتصال والتوثيق والتقييمات.

* **تقييم شامل لصفحة الصنايعي**:
  ```text
  /impeccable critique app/(site)/craftsman/[slug]/page.tsx
  ```
* **صقل شريط الاتصال السفلي للموبايل (Sticky Call Bar)**:
  ```text
  /impeccable polish components/craftsman/StickyCallBar.tsx
  ```
* **صقل كارت الاتصال الثابت للديسكتوب (Craftsman Contact Card)**:
  ```text
  /impeccable polish components/craftsman/CraftsmanContactCard.tsx
  ```
* **تحسين قسم التقييمات والآراء (Reviews Section)**:
  ```text
  /impeccable typeset components/craftsman/CraftsmanReviewsSection.tsx
  ```
* **التشطيب النهائي الكامل لكارت البروفايل**:
  ```text
  /impeccable polish components/craftsman/CraftsmanDetail.tsx
  ```

---

### 3. صفحة ومودال البحث السريع (Search Experience)
> محرك البحث المحلي الذكي للمناطقء والتخصصات.

* **تقييم وصقل تجربة مودال البحث السريع**:
  ```text
  /impeccable critique components/search/SearchModal.tsx
  ```
  *(✅ تم إنجازه: التنقل الكامل بالأسهم وEnter، تبسيط حالة غياب النتائج، إضافة فوتر اختصارات الكيبورد ESC / ↑↓ / ↵، وتجميل سجل البحث)*
* **صقل صفحة نتائج البحث المخصصة والفلاتر السريعة**:
  ```text
  /impeccable polish app/(site)/search/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: سايدبار فلاتر احترافي ثابت على الديسكتوب Sticky Sidebar، أكورديون تفاعلي للخيارات، تسريع استعلام البحث وتخفيض اللود بنسبة 92%، زر «عرض المزيد» بدون قفز بالسكرول، إصلاح انزلاق حقل الموبايل، صقل كروت الصنايعية بالكامل مع أزرار متناظرة كاملة العرض وشارة المنطقة بالدبوس، وتفعيل نمط المسودة Draft State في نافذة الفلاتر السفلية بحيث يتم التطبيق عند ضغط «عرض النتائج» فقط)*

---

### 4. صفحة طلب فني (Leads / Request Creation)
> نموذج حجز خدمة وطلب مكالمة من الصنايعية في السويس.

* **تقييم تجربة النموذج ومراحل الإدخال (UX Review)**:
  ```text
  /impeccable critique app/(site)/request/new/page.tsx
  ```
* **ضبط ألوان الحقول والتفاعل والأخطاء**:
  ```text
  /impeccable colorize app/(site)/request/new/page.tsx
  ```
* **صقل تجربة المستخدم وتأكيد إرسال الطلب**:
  ```text
  /impeccable polish app/(site)/request/new/page.tsx
  ```

---

### 5. صفحة انضمام صنايعي جديد (Join / Onboarding)
> بوابة استقطاب الحرفيين وأصحاب المهن في السويس.

* **تقييم رحلة انضمام الصنايعي**:
  ```text
  /impeccable critique app/(site)/join/page.tsx
  ```
  * **ضبط ألوان الحقول والتفاعل والأخطاء**:
  ```text
  /impeccable colorize app/(site)/join/page.tsx
  ```
* **صقل النموذج ورفع الصور والبيانات**:
  ```text
  /impeccable polish app/(site)/join/page.tsx
  ```

---

### 6. صفحات دليل التصنيفات (Categories Index & Detail)
> استعراض الحرف والصنايعية حسب التخصص والحي.

* **صقل شبكة التصنيفات العامة**:
  ```text
  /impeccable polish app/(site)/categories/page.tsx
  ```
* **تقييم صفحة التخصص المحدد (مثل: سباكة في السويس)**:
  ```text
  /impeccable critique app/(site)/category/[slug]/page.tsx
  ```
* **صقل نتائج الصنايعية في التخصص**:
  ```text
  /impeccable polish app/(site)/category/[slug]/page.tsx
  ```

---

### 7. صفحات العميل الشخصية (User Touchpoints)

* **صفحة المفضلة (حفظ الصنايعية للرجوع إليهم)**:
  ```text
  /impeccable polish app/(site)/favorites/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: معالجة وميض التحميل والـ hydration عبر شاشة هيكلية متوافقة loading.tsx و FavoritesGridSkeleton، وإضافة إشعار التراجع السريع العائم Undo Toast لمدة 5 ثوانٍ عند الحذف بالخطأ، وإتاحة شريط كبسولات لتصفية المحفوظات حسب التخصص، وتطوير حالة فراغ جذابة ومرحبة مع روابط مباشرة لأهم مهن السويس)*
* **صفحة الإشعارات والتنبيهات المباشرة**:
  ```text
  /impeccable polish app/(site)/notifications/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: إضافة شاشة تحميل هيكلية loading.tsx و NotificationsSkeleton لمنع الشاشة البيضاء، إضافة تبويبات الفلترة بين «كل الإشعارات» و«غير المقروءة»، تمييز بصري عالي التباين للإشعارات الجديدة مع نقطة تنبيه حية، تحسين إمكانية الوصول والتفاعل بالكيبورد، ضبط الصياغة وتنسيق الأرقام بالعربية، وإصلاح قياسات الخطوط وألوان النظام)*

* **صفحة الملف الشخصي والإعدادات (العميل - الفني - المشرف)**:
  ```text
  /impeccable polish app/(site)/profile/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: تصحيح الرابط المعطل في شريط المؤشرات الحيوية ليربط بصفحة الطلبات الفعلية `/my-requests`، تنقية الألوان الصلبة واستبدالها بنظام التوكنز القياسي 100% [`accent`, `action`, `warning`, `danger`]، تخصيص الزر الأساسي للعميل ليكون «متابعة طلباتي الحالية» مع مدخل ثانوي أنيق للانضمام كفني، بناء شاشة تحميل هيكلية متكاملة `ProfileSkeleton` و `loading.tsx` لمنع القفز البصري CLS، وتوحيد مساحات اللمس بارتفاع `min-h-12` لجميع الأزرار تفاعلياً)*

* **صفحة تقييماتي ومراجعاتي (ماي ريفيوز)**:
  ```text
  /impeccable polish app/(site)/my-reviews/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: نقل المسار إلى جذر المسارات كصفحة مستقلة `/my-reviews` مع إعادة توجيه آمنة للمسار القديم، توحيد الهيدر مع `PageTitleRow`، توفير شاشة تحميل هيكلية متطورة `MyReviewsSkeleton` و `loading.tsx` لمنع الـ CLS، استخدام متغيرات نظام التصميم 100% `text-warning` للنجوم بدون ألوان عشوائية، وضبط حماية المسار في `proxy.ts` ورسالة تسجيل الدخول)*

* **صفحة سجل نشاطاتي وتفاعلاتي (نشاطاتي)**:
  ```text
  /impeccable polish app/(site)/activity/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: توسيع القائمة لتشمل كروت مباشرة لكل من «تقييماتي ومراجعاتي»، «قائمتي المفضلة»، «التنبيهات والإشعارات»، و«طلبات الصيانة (طلباتي)»، توحيد الهيدر عبر `PageTitleRow`، إضافة شاشة تحميل هيكلية `ActivitySkeleton` و `loading.tsx`، وضبط ألوان الكروت التفاعلية ومساحات اللمس القياسية `min-h-12`)*

* **صفحة طلبات العميل ونشاطه (طلباتي)**:
  ```text
  /impeccable polish app/(site)/my-requests/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: نقل المسار إلى مجلد مباشر ومستقل `/my-requests` بدون ريديركت، بناء مكون متتبع المقاعد الثلاثة البصري `LeadSlotsTracker`، تصحيح الهرمية بوضع زر «تم إنجاز الشغل» في ذيل الردود بعد التواصل مع الفنيين، دمج أزرار الاتصال والواتساب أفقياً على الموبايل لتوفير أكثر من 50% من الارتفاع الرأسي، إضافة بطاقة بث حي رادارية نبضية عند انتظار أول رد، إضافة زر «طلب مماثل» لتكرار الطلبات المنتهية بنقرة واحدة، وترقية حالات الخلو بعبارات توضيحية غنية ومطمئنة)*
* **صفحة تسجيل الدخول الموحدة (Login)**:
  ```text
  /impeccable polish app/(auth)/login/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: بناء بطاقة دخول مركزية فاخرة rounded-3xl مع شعار وهوية السويس، شاشة تحميل هيكلية loading.tsx لمنع الـ CLS، بانر سياقي ذكي يشرح بدقة سبب التحويل [المفضلة/الفني/الطلبات/المشرف] لزيادة الثقة، استبدال ألوان التحذير والأخطاء بمتغيرات النظام، ورابط عودة واضح ومريح)*

---

## 🛠️ المرحلة الثانية: لوحة تحكم الفني (`/dashboard`)

> الواجهة المخصصة للصنايعي لإدارة طلبات العمل والبروفايل.

* **تقييم شامل لنظرة لوحة الفني العامة**:
  ```text
  /impeccable critique app/dashboard/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: ترحيل التنقل من `DashboardChips` القديم (سايدبار/شيبس مزدوج) إلى شريط تبويبات أفقي موحد `DashboardSubnav` بعرض كامل مع شارة عدد العروض المتاحة، توسيع كانفاس لوحة التحكم إلى `max-w-7xl` المطابق للهيدر، إعادة هيكلة الـ layout بنمط موحد عبر الثلاث تابات: `space-y-6` → `DashboardSubnav` → شبكة 12 عمود (8 رئيسي + 4 سايدبار)، ترتيب موبايل ذكي: إحصائيات → تفاعلات → هوية → اكتمال → مراجعات، حذف `DashboardChips.tsx` بالكامل بدون ترك أي كود ميت، اجتياز `impeccable detect` بـ 0 عيوب و`tsc --noEmit` بـ 0 أخطاء)*
* **صقل جدول واستقبال طلبات الزبائن الحية (Leads Feed)**:
  ```text
  /impeccable polish app/dashboard/leads/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: اعتماد `DashboardSubnav` الموحد مع شارة العروض، شريط هوية مقتضب `LeadsHeaderStrip` مع مبدل الملفات، مصفوفة مؤشرات `LeadsMetricsGrid`، تنبيهات `PushEnableBanner` و`OtherProfilesAlert`، أقسام عروض مفتوحة ومستلمة ومغلقة منظمة ومتجاوبة)*
* **صقل كروت الرد السريع والتواصل مع العميل**:
  ```text
  /impeccable layout components/dashboard/leads/ClaimedLeadCard.tsx
  ```
  *(✅ تم إنجازه بالكامل: اعتماد كروت التفاعل المباشرة `OpenLeadCard` للطلبات المتاحة مع زر الاستلام الفوري، كارت `ClaimedLeadCard` للطلبات المقبولة، مكوّن إجراءات التواصل `ClaimedLeadContactActions` بصف اتصال هاتفي مع نسخ الرقم، صف واتساب العميل الأخضر، وزر سحب الاستلام مع نافذة تأكيد آمنة `ConfirmDialog`، ومقاسات لمس قياسية `min-h-12` لكافة الأزرار التفاعلية)*
* **صقل صفحة تعديل بروفايل الفني ومعرض الأعمال**:
  ```text
  /impeccable polish app/dashboard/profile/page.tsx
  ```
  *(✅ تم إنجازه بالكامل: اعتماد شريط التبويبات الموحد الجديد `DashboardSubnav` بعرض كامل وإشعار لعدد طلبات العمل المتاحة، توسيع كانفاس لوحة التحكم إلى العرض المريح `max-w-7xl` المطابق لهيدر الموقع، تنظيم حقول استمارة التعديل `ProfileEditForm` في شبكة ثنائية متجاوبة تمنع تمدد الحقول، دمج كارت الصورة الشخصية وكارت المعاينة الحية في كارت واحد استعراضي متكامل `DashboardHeader`، تحويل محرر وتنسيق الصورة إلى نافذة منبثقة معتمدة `Modal` بحجم `xl` مع إطار 4:3 وسينمائية الـ blur، إزالة الازدواجية البرمجية وحذف المكون الزائد `ProfileAvatarSection.tsx` بدون ترك أي كود ميت، تقوية الفورم بحماية `isDirty` و`beforeunload`، إضافة اختصار `Ctrl+S` ومزامنة الهاتف مع الواتساب بنقرة واحدة، واجتياز التقييم بـ 40/40 ومجموعة اختبارات خضراء 100%)*

---

## 🛡️ المرحلة الثالثة: لوحة الإدارة والتحكم للمشرف (`/admin`)

> أدوات الإشراف، المراجعة، التحليلات، وإدارة المحتوى.

* **تقييم واجهة الإحصائيات والتحليلات الرئيسية**:
  ```text
  /impeccable critique app/admin/(dashboard)/page.tsx
  ```
* **صقل جدول إدارة الصنايعية (تعديل، تعطيل، توثيق)**:
  ```text
  /impeccable polish app/admin/(dashboard)/craftsmen/page.tsx
  ```
* **صقل مراجعة طلبات الانضمام الجديدة (Pending Requests)**:
  ```text
  /impeccable polish app/admin/(dashboard)/requests/page.tsx
  ```
* **صقل إدارة ومراقبة طلبات الليدز (Leads Oversight)**:
  ```text
  /impeccable polish app/admin/(dashboard)/leads/page.tsx
  ```
* **صقل إدارة التصنيفات والمناطق في السويس**:
  ```text
  /impeccable polish app/admin/(dashboard)/categories/page.tsx
  ```
* **صقل صندوق رسائل التواصل والبلاغات**:
  ```text
  /impeccable polish app/admin/(dashboard)/messages/page.tsx
  ```
* **صقل أدوات التشخيص والفحص السريع (Diagnostics)**:
  ```text
  /impeccable polish app/admin/(dashboard)/diagnostics/page.tsx
  ```

---

## 💎 المرحلة الرابعة: الهيكل المشترك والملاحة (Global Shell)

> العناصر الحاضرة في كل الصفحات (Header, BottomNav, Footer).

* **صقل الهيدر العلوي وشريط التنقل للديسكتوب**:
  ```text
  /impeccable polish components/shared/Header.tsx
  ```
* **صقل الشريط السفلي العائم للموبايل (Mobile Bottom Navigation)**:
  ```text
  /impeccable polish components/shared/BottomNav.tsx
  ```
* **صقل قائمة المستخدم المنسدلة ومفتاح تبديل الثيم**:
  ```text
  /impeccable polish components/shared/layout/UserMenu.tsx
  ```
* **صقل الفوتر السفلي (Footer) والروابط القانونية**:
  ```text
  /impeccable polish components/shared/Footer.tsx
  ```

---

## ⚡ أوامر سريعة للمقارنة والتوليد الحي

عند رغبتك في تجربة أشكال بديلة لأي كارت أو زر أو قسم بالمتصفح:

```text
# توليد 3 بدائل لكارت الصنايعي لاختيار الأجمل منها:
/impeccable generate 3 alternatives components/craftsman/CraftsmanCard.tsx

# تفعيل الوضع التفاعلي المباشر بالمتصفح:
/impeccable live

# جعل تصميم صفحة معينة أكثر جرأة وحضوراً بصرياً:
/impeccable bolder app/(site)/join/page.tsx

# تبسيط وتهدئة صفحة مزدحمة:
/impeccable distill app/(site)/request/new/page.tsx
```



















/impeccable adapt app/dashboard/page.tsx
إعادة تنظيم وتجاوب عناصر الصفحة على شاشات الموبايل (order-first / order-last أو تقسيم التبويبات) لتقديم مصفوفة الإحصائيات وسجل تفاعلات الزبائن في منطقة إبهام اليد فوراً فوق كارت الصورة الطويل.

/impeccable clarify components/dashboard/CraftsmanStatsGrid.tsx
تبسيط صياغة "معدل التحويل" بإضافة تلميح إرشادي مبسط (Tooltip: "نسبة الزوار الذين اتصلوا بك")، وتوضيح شرط الـ 40 حرفاً للنبذة في كارت الجاهزية.

/impeccable harden app/dashboard/page.tsx
ترقية معالجة الأخطاء عند تعذر جلب بيانات الفني (!data) من مجرد نص صامت إلى مكون متكامل يتيح زراً لإعادة المحاولة (Retry) وروابط مساعدة.

/impeccable distill components/dashboard/CraftsmanActivityFeed.tsx
إضافة خيارات تصفية زمنية لسجل تفاعلات الزبائن (آخر 7 أيام / آخر 30 يوماً / الكل) لتسهيل مراجعة الحرفي لنشاطه الأسبوعي والشهري.

/impeccable typeset components/dashboard/
توحيد كافة مقاسات الخطوط الـ 14 الفرعية (text-[10px] و text-[11px]) إلى الحجم القياسي text-xs (12px) لضمان الالتزام بسلم الخطوط المعتمد في DESIGN.md.

/impeccable polish app/dashboard/page.tsx
جولة الصقل والتنقيح النهائية لفحص المكونات مجتمعة، وضمان سلاسة الانتقالات وخلو الكود من أي تراجعات بصرية