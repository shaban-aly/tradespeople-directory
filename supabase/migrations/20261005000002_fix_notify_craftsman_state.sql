BEGIN;

CREATE OR REPLACE FUNCTION public.notify_craftsman_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner uuid;
BEGIN
  -- Notify about verification changes
  IF OLD.verified IS DISTINCT FROM NEW.verified
     AND NEW.is_published = OLD.is_published THEN
    v_owner := NEW.owner_user_id;
    IF v_owner IS NOT NULL THEN
      PERFORM public.create_notification(
        v_owner,
        'verified',
        CASE WHEN NEW.verified THEN 'بروفايلك اتحقق ✅' ELSE 'إلغاء التوثيق' END,
        CASE WHEN NEW.verified
             THEN '«' || NEW.name || '» بقى موثّق في الدليل — يظهر بشارة موثّق.'
             ELSE 'إلغيت شارة التوثيق من بروفايل «' || NEW.name || '».' END,
        jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name, 'verified', NEW.verified),
        'verified:' || NEW.id::text || ':' || NEW.verified::text
      );
    END IF;
  END IF;

  -- Notify about publish changes
  IF NEW.is_published IS DISTINCT FROM OLD.is_published
     AND OLD.status = 'approved' THEN
    v_owner := NEW.owner_user_id;
    IF v_owner IS NOT NULL THEN
      PERFORM public.create_notification(
        v_owner,
        'published',
        CASE WHEN NEW.is_published THEN 'بروفايلك اتنشر ✅' ELSE 'بروفايلك اتعمل عليه إخفاء' END,
        CASE WHEN NEW.is_published
             THEN '«' || NEW.name || '» دلوقتي ظاهر للزوار في الدليل.'
             ELSE '«' || NEW.name || '» متخفّي عن الدليل — تواصل مع المشرف.' END,
        jsonb_build_object('craftsman_id', NEW.id, 'name', NEW.name, 'published', NEW.is_published),
        'publish:' || NEW.id::text || ':' || NEW.is_published::text
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

COMMIT;
