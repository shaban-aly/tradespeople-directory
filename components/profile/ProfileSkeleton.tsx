/**
 * هيكل التحميل الهيكلي (Skeleton) لصفحة الملف الشخصي.
 * يطابق بدقة هندسة الشبكة المزدوجة (5 أعمدة + 7 أعمدة) ويمنع قفزات التخطيط (CLS).
 * (عرض خالص — Server Component بدون "use client").
 */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 space-y-6" aria-busy="true" aria-label="جاري تحميل الملف الشخصي">
      {/* سطر العنوان الموحد */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-8 w-28 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-4 w-44 rounded-md bg-muted/15 animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-xl border border-border/60 bg-card animate-pulse" />
      </div>

      {/* التقسيمة الرئيسية: 5 أعمدة للهوية + 7 أعمدة للإعدادات */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* العمود الجانبي الأيمن: الهوية والمؤشرات الحيوية (5 أعمدة) */}
        <div className="lg:col-span-5 space-y-6">
          {/* كارت الملف الشخصي الهيكلي */}
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 sm:p-7 shadow-xs text-center flex flex-col items-center">
            {/* الصورة الشخصية */}
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-muted/20 animate-pulse ring-4 ring-background" />

            {/* الاسم والشارة */}
            <div className="mt-3.5 flex items-center justify-center gap-2">
              <div className="h-6 w-36 rounded-lg bg-muted/20 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-muted/15 animate-pulse" />
            </div>

            {/* البريد الإلكتروني وتاريخ التسجيل */}
            <div className="mt-2 h-4 w-48 rounded-md bg-muted/15 animate-pulse" />
            <div className="mt-1.5 h-3 w-32 rounded-md bg-muted/10 animate-pulse" />

            {/* زر الإجراء الرئيسي */}
            <div className="mt-5 w-full">
              <div className="h-12 w-full rounded-xl bg-muted/20 animate-pulse" />
            </div>
          </div>

          {/* شريط المؤشرات الحيوية الهيكلي */}
          <div className="rounded-2xl border border-border/70 bg-card p-2 sm:p-2.5 shadow-xs grid grid-cols-3 divide-x divide-x-reverse divide-border/60">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="flex flex-col items-center justify-center py-2 px-1">
                <div className="h-6 w-10 rounded-md bg-muted/20 animate-pulse" />
                <div className="mt-1.5 h-3.5 w-14 rounded-md bg-muted/15 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* العمود الرئيسي الأيسر: الإعدادات والأمان (7 أعمدة) */}
        <div className="lg:col-span-7 space-y-6">
          {/* مجموعة النشاط والتفاعل */}
          <div className="space-y-2">
            <div className="h-3.5 w-32 mx-1 rounded-md bg-muted/20 animate-pulse" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/20 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded-md bg-muted/20 animate-pulse" />
                    <div className="h-3 w-48 rounded-md bg-muted/15 animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-5 rounded-md bg-muted/15 animate-pulse" />
              </div>
            </div>
          </div>

          {/* مجموعة إعدادات التطبيق والمظهر */}
          <div className="space-y-2">
            <div className="h-3.5 w-36 mx-1 rounded-md bg-muted/20 animate-pulse" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs divide-y divide-border/60">
              {/* صف المظهر */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/20 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 rounded-md bg-muted/20 animate-pulse" />
                    <div className="h-3 w-32 rounded-md bg-muted/15 animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-11 rounded-full bg-muted/20 animate-pulse" />
              </div>

              {/* صف الإشعارات */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/20 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded-md bg-muted/20 animate-pulse" />
                    <div className="h-3 w-48 rounded-md bg-muted/15 animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-11 rounded-full bg-muted/20 animate-pulse" />
              </div>

              {/* صف التثبيت */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/20 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 rounded-md bg-muted/20 animate-pulse" />
                    <div className="h-3 w-52 rounded-md bg-muted/15 animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded-lg bg-muted/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* مجموعة الأمان وتسجيل الخروج */}
          <div className="space-y-2">
            <div className="h-3.5 w-36 mx-1 rounded-md bg-muted/20 animate-pulse" />
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/20 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded-md bg-muted/20 animate-pulse" />
                    <div className="h-3 w-44 rounded-md bg-muted/15 animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-5 rounded-md bg-muted/15 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
