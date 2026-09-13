begin;
select plan(8);

select ok(relrowsecurity, 'app_settings has RLS enabled') from pg_class where oid = 'public.app_settings'::regclass;
select ok(relrowsecurity, 'leads has RLS enabled') from pg_class where oid = 'public.leads'::regclass;
select ok(relrowsecurity, 'lead_score_reasons has RLS enabled') from pg_class where oid = 'public.lead_score_reasons'::regclass;
select ok(relrowsecurity, 'scan_jobs has RLS enabled') from pg_class where oid = 'public.scan_jobs'::regclass;
select ok(relrowsecurity, 'scan_job_events has RLS enabled') from pg_class where oid = 'public.scan_job_events'::regclass;
select ok(relrowsecurity, 'lead_activities has RLS enabled') from pg_class where oid = 'public.lead_activities'::regclass;
select ok(relrowsecurity, 'telegram_notifications has RLS enabled') from pg_class where oid = 'public.telegram_notifications'::regclass;
select ok(relrowsecurity, 'provider_usage_daily has RLS enabled') from pg_class where oid = 'public.provider_usage_daily'::regclass;

select * from finish();
rollback;
