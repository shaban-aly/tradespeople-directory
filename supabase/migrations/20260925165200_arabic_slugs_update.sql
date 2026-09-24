-- Migration: Update all craftsmen slugs to [singular_name]-[name]-[hash] and update generation function

CREATE OR REPLACE FUNCTION public.approve_craftsman_application(p_craftsman_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_craftsman  public.craftsmen;
  v_singular_name text;
  v_clean_name text;
  v_clean_cat  text;
  v_slug       text;
  v_attempt    int := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  SELECT * INTO v_craftsman
  FROM public.craftsmen
  WHERE id = p_craftsman_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الطلب غير موجود';
  END IF;

  IF v_craftsman.status <> 'pending' THEN
    RAISE EXCEPTION 'الطلب اتعامل معاه من قبل';
  END IF;

  IF v_craftsman.name IS NULL OR v_craftsman.category_id IS NULL
     OR v_craftsman.area_id IS NULL OR v_craftsman.phone IS NULL THEN
    RAISE EXCEPTION 'الطلب ناقص ومحتاج مراجعة يدوية';
  END IF;

  IF v_craftsman.submitted_by IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_craftsman.submitted_by AND craftsman_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'المقدم يمتلك صنايعي بالفعل — اربط حسابه الموجود مباشرة';
    END IF;
  END IF;

  -- استخراج singular_name
  SELECT singular_name INTO v_singular_name
  FROM public.categories
  WHERE id = v_craftsman.category_id;

  -- تنظيف اسم الصانع
  v_clean_name := lower(regexp_replace(v_craftsman.name, '[^a-zA-Z0-9\u0621-\u064A\u0660-\u0669]+', '-', 'g'));
  v_clean_name := trim(both '-' from v_clean_name);
  v_clean_name := regexp_replace(v_clean_name, '-+', '-', 'g');

  IF length(v_clean_name) < 2 THEN
    v_clean_name := 'craftsman';
  ELSIF length(v_clean_name) > 35 THEN
    v_clean_name := substr(v_clean_name, 1, 35);
    v_clean_name := trim(trailing '-' from v_clean_name);
  END IF;

  -- تنظيف اسم المهنة
  v_clean_cat := lower(regexp_replace(COALESCE(v_singular_name, 'صنايعي'), '[^a-zA-Z0-9\u0621-\u064A\u0660-\u0669]+', '-', 'g'));
  v_clean_cat := trim(both '-' from v_clean_cat);
  v_clean_cat := regexp_replace(v_clean_cat, '-+', '-', 'g');

  LOOP
    v_attempt := v_attempt + 1;
    -- توليد الرابط
    v_slug := v_clean_cat || '-' || v_clean_name || '-' || substr(md5(gen_random_uuid()::text), 1, 4);

    BEGIN
      UPDATE public.craftsmen
      SET status = 'approved',
          is_published = true,
          slug = v_slug
      WHERE id = p_craftsman_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN
        RAISE EXCEPTION 'تعذر توليد رابط فريد للصنايعي — جرّب تاني';
      END IF;
    END;
  END LOOP;

  IF v_craftsman.submitted_by IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'craftsman',
        craftsman_id = p_craftsman_id
    WHERE id = v_craftsman.submitted_by;
  END IF;

  RETURN p_craftsman_id;
END;
$function$;

-- Update existing craftsmen slugs!
ALTER TABLE public.craftsmen DISABLE TRIGGER trg_craftsman_owner_update_guard;

DO $$
DECLARE
  rec RECORD;
  v_clean_name text;
  v_clean_cat text;
  v_new_slug text;
BEGIN
  FOR rec IN 
    SELECT c.id, c.name, cat.singular_name 
    FROM public.craftsmen c
    JOIN public.categories cat ON c.category_id = cat.id
  LOOP
    v_clean_name := lower(regexp_replace(rec.name, '[^a-zA-Z0-9\u0621-\u064A\u0660-\u0669]+', '-', 'g'));
    v_clean_name := trim(both '-' from v_clean_name);
    v_clean_name := regexp_replace(v_clean_name, '-+', '-', 'g');

    v_clean_cat := lower(regexp_replace(COALESCE(rec.singular_name, 'صنايعي'), '[^a-zA-Z0-9\u0621-\u064A\u0660-\u0669]+', '-', 'g'));
    v_clean_cat := trim(both '-' from v_clean_cat);
    v_clean_cat := regexp_replace(v_clean_cat, '-+', '-', 'g');

    IF length(v_clean_name) < 2 THEN v_clean_name := 'craftsman'; END IF;
    IF length(v_clean_name) > 35 THEN v_clean_name := substr(v_clean_name, 1, 35); END IF;
    v_clean_name := trim(trailing '-' from v_clean_name);

    v_new_slug := v_clean_cat || '-' || v_clean_name || '-' || substr(md5(gen_random_uuid()::text), 1, 4);

    UPDATE public.craftsmen
    SET slug = v_new_slug
    WHERE id = rec.id;
  END LOOP;
END;
$$;

ALTER TABLE public.craftsmen ENABLE TRIGGER trg_craftsman_owner_update_guard;
