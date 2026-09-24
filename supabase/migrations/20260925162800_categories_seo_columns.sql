-- Migration: Add singular and plural names to categories for SEO

-- 1. Add columns (nullable initially to allow updates)
ALTER TABLE public.categories 
ADD COLUMN singular_name VARCHAR(255),
ADD COLUMN plural_name VARCHAR(255);

-- 2. Update existing rows based on current trade names
UPDATE public.categories SET singular_name = 'سباك', plural_name = 'سباكين' WHERE name = 'سباكة';
UPDATE public.categories SET singular_name = 'كهربائي', plural_name = 'كهربائية' WHERE name = 'كهرباء';
UPDATE public.categories SET singular_name = 'نجار', plural_name = 'نجارين' WHERE name = 'نجارة';
UPDATE public.categories SET singular_name = 'فني تكييف', plural_name = 'فنيين تكييف' WHERE name = 'تكييف وتبريد';
UPDATE public.categories SET singular_name = 'نقاش', plural_name = 'نقاشين' WHERE name = 'دهانات';
UPDATE public.categories SET singular_name = 'فني سيراميك', plural_name = 'فنيين سيراميك' WHERE name = 'سيراميك';
UPDATE public.categories SET singular_name = 'فني ألوميتال', plural_name = 'فنيين ألوميتال' WHERE name = 'ألوميتال';
UPDATE public.categories SET singular_name = 'حداد', plural_name = 'حدادين' WHERE name = 'حدادة';
UPDATE public.categories SET singular_name = 'سواق', plural_name = 'سواقين' WHERE name = 'نقل وتوصيل';
UPDATE public.categories SET singular_name = 'مبيض محارة', plural_name = 'مبيضين محارة' WHERE name = 'مبيض محارة';
UPDATE public.categories SET singular_name = 'فني دش', plural_name = 'فنيين دش' WHERE name = 'تركيب الدش';
UPDATE public.categories SET singular_name = 'فني أجهزة منزلية', plural_name = 'فنيين أجهزة منزلية' WHERE name = 'صيانة اجهزة منزلية';
UPDATE public.categories SET singular_name = 'فني رخام', plural_name = 'فنيين رخام' WHERE name = 'اعمال رخام';
UPDATE public.categories SET singular_name = 'منجد', plural_name = 'منجدين' WHERE name = 'تنجيد';
UPDATE public.categories SET singular_name = 'ميكانيكي', plural_name = 'ميكانيكية' WHERE name = 'ميكانيكي';
UPDATE public.categories SET singular_name = 'فني كاميرات', plural_name = 'فنيين كاميرات' WHERE name = 'كاميرات مراقبه';
UPDATE public.categories SET singular_name = 'فني مصاعد', plural_name = 'فنيين مصاعد' WHERE name = 'مصاعد';
UPDATE public.categories SET singular_name = 'عامل تكسير', plural_name = 'عمال تكسير' WHERE name = 'اعمال تكسير';
UPDATE public.categories SET singular_name = 'بنا', plural_name = 'بنائين' WHERE name = 'مباني';
UPDATE public.categories SET singular_name = 'فني جبسمبورد', plural_name = 'فنيين جبسمبورد' WHERE name = 'جبسمبورد';

-- For any missed ones (fallback to name just in case)
UPDATE public.categories SET singular_name = name WHERE singular_name IS NULL;
UPDATE public.categories SET plural_name = name WHERE plural_name IS NULL;

-- 3. Make columns non-nullable after data population
ALTER TABLE public.categories 
ALTER COLUMN singular_name SET NOT NULL,
ALTER COLUMN plural_name SET NOT NULL;
