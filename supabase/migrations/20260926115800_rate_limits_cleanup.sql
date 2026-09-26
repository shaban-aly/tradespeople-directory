-- Enable pg_cron if not already enabled (usually handled by Supabase, but good practice)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to cleanup rate_limits older than 2 hours
-- Runs every day at 4:00 AM UTC
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 4 * * *',
  $$ DELETE FROM rate_limits WHERE window_start < now() - interval '2 hours' $$
);
