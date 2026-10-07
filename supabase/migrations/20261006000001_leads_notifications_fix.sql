BEGIN;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'join_approved', 'join_rejected', 'verified', 'published',
    'account_linked', 'review_added', 'report_status',
    'new_request', 'new_report', 'new_message', 'new_craftsman',
    'welcome', 'admin_broadcast', 'lead_new', 'lead_claimed'
  )
);

COMMIT;
