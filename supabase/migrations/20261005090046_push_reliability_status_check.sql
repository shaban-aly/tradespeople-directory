-- =============================================================================
-- 20261005090046_push_reliability_status_check — توسيع قيد حالة anonymous_push_outbox
-- =============================================================================
-- قيد الحالة الذي وضعته `0017_anonymous_push` قفل على
-- ('pending','sent','failed','skipped') بلا 'processing'، فأول UPDATE للحجز
-- كان يرفضه القيد نفسه وتسقط كل محاولة مجهولة عند أول claim. النص موسّع هنا
-- لا محذوف: القائمة تبقى مغلقة بمجرد إضافة 'processing'، فتتطابق مع
-- `notification_push_outbox` في نفس القيمة المقصودة.

ALTER TABLE public.anonymous_push_outbox
  DROP CONSTRAINT IF EXISTS anonymous_push_outbox_status_check;
ALTER TABLE public.anonymous_push_outbox
  ADD CONSTRAINT anonymous_push_outbox_status_check
  CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped'));
