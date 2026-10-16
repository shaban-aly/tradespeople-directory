-- ==============================================================================
-- 20261016151000_site_settings.sql
-- جدول site_settings المتحكم المركزي لإعدادات الموقع مع جدول أرقام الإدارة التابع له
-- بنية علائقية صريحة وسهلة الفهم والصيانة بدون تكديس في JSON
-- ==============================================================================

-- 1. جدول إعدادات الموقع الرئيسي والمتحكم المركزي (site_settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_routing_enabled boolean NOT NULL DEFAULT false,
  whatsapp_admin_template text NOT NULL DEFAULT 'السلام عليكم، بتواصل بخصوص الفني "{craftsman_name}" ({category_name}) المعروض على دليل الصنايعية بالسويس ومحتاج مساعدة في شغل.',
  whatsapp_direct_template text NOT NULL DEFAULT 'السلام عليكم يا {craftsman_name}، شفت بياناتك على دليل الصنايعية بالسويس ومحتاج استفسر عن شغل {category_name}.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'المتحكم المركزي لإعدادات الموقع ومؤشر التوجيه والرسائل بأعمدة صريحة';
COMMENT ON COLUMN public.site_settings.id IS 'سجل إعدادات الموقع الرئيسي الدائم (id = 1)';
COMMENT ON COLUMN public.site_settings.is_routing_enabled IS 'مفتاح التحكم في تفعيل تحويل الاتصالات والرسائل لأرقام الإدارة';
COMMENT ON COLUMN public.site_settings.whatsapp_admin_template IS 'قالب رسالة الواتساب للإدارة مع دعم المتغيرات الذكية';
COMMENT ON COLUMN public.site_settings.whatsapp_direct_template IS 'قالب رسالة الواتساب المباشرة لرقم الفني';

-- 2. جدول أرقام هواتف الإدارة (علاقة تابعة 1-إلى-متعدد مرتبطة بـ site_settings)
CREATE TABLE IF NOT EXISTS public.admin_contact_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id integer NOT NULL DEFAULT 1 REFERENCES public.site_settings(id) ON DELETE CASCADE,
  phone text NOT NULL,
  label text NOT NULL DEFAULT 'خط الإدارة',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_contact_numbers IS 'سجل أرقام هواتف الإدارة للتوزيع المتساوي والعشوائي الذكي للمكالمات والرسائل';
COMMENT ON COLUMN public.admin_contact_numbers.setting_id IS 'معرف إعدادات الموقع التابع لها';
COMMENT ON COLUMN public.admin_contact_numbers.phone IS 'رقم الهاتف والواتساب بصيغته الدولية أو المحلية';
COMMENT ON COLUMN public.admin_contact_numbers.label IS 'مسمى توضيحي للخط (مثال: خط خدمة العملاء 1)';
COMMENT ON COLUMN public.admin_contact_numbers.is_active IS 'حالة تفعيل الخط لاستقبال التحويلات';
COMMENT ON COLUMN public.admin_contact_numbers.display_order IS 'ترتيب ظهور الخط في اللوحة';

-- 3. تفعيل أمان مستوى الصف (Row Level Security)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_contact_numbers ENABLE ROW LEVEL SECURITY;

-- 4. الصلاحيات الأساسية
REVOKE ALL ON public.site_settings FROM PUBLIC;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO authenticated;

REVOKE ALL ON public.admin_contact_numbers FROM PUBLIC;
GRANT SELECT ON public.admin_contact_numbers TO anon, authenticated;
GRANT ALL ON public.admin_contact_numbers TO authenticated;

-- 5. سياسات RLS لجدول site_settings
DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin manage site_settings" ON public.site_settings;
CREATE POLICY "Allow admin manage site_settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 6. سياسات RLS لجدول admin_contact_numbers
DROP POLICY IF EXISTS "Allow public read admin_contact_numbers" ON public.admin_contact_numbers;
CREATE POLICY "Allow public read admin_contact_numbers"
  ON public.admin_contact_numbers
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow admin manage admin_contact_numbers" ON public.admin_contact_numbers;
CREATE POLICY "Allow admin manage admin_contact_numbers"
  ON public.admin_contact_numbers
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 7. البيانات الأولية الافتراضية
INSERT INTO public.site_settings (id, is_routing_enabled)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.admin_contact_numbers (setting_id, phone, label, is_active, display_order)
SELECT 1, '+201019979315', 'خط الإدارة الأساسي', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.admin_contact_numbers WHERE phone = '+201019979315');

INSERT INTO public.admin_contact_numbers (setting_id, phone, label, is_active, display_order)
SELECT 1, '+201069582453', 'خط الإدارة الاحتياطي', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.admin_contact_numbers WHERE phone = '+201069582453');
