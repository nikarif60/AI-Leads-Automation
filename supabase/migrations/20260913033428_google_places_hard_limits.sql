alter table public.app_settings
  drop constraint app_settings_scan_interval_hours_check,
  alter column scan_interval_hours set default 5;

update public.app_settings
set scan_interval_hours = 5;

alter table public.app_settings
  add constraint app_settings_scan_interval_hours_check check (scan_interval_hours = 5),
  add column google_requests_per_scan smallint not null default 5
    check (google_requests_per_scan between 1 and 5),
  add column daily_google_request_limit smallint not null default 25
    check (daily_google_request_limit between 1 and 25);

update public.app_settings
set google_requests_per_scan = 5,
    daily_google_request_limit = 25;

create or replace function public.reserve_google_places_requests(
  p_owner_id uuid,
  p_units smallint,
  p_daily_limit smallint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_units not between 1 and 5 or p_daily_limit not between 1 and 25 then
    raise exception 'Google Places hard limits are 1-5 requests per run and 1-25 requests per day';
  end if;

  insert into public.provider_usage_daily (
    owner_id, usage_date, provider, metric, units, estimated_cost_usd, limit_units
  ) values (
    p_owner_id, current_date, 'google_places', 'requests', p_units, 0, p_daily_limit
  )
  on conflict (owner_id, usage_date, provider, metric) do update
    set units = public.provider_usage_daily.units + excluded.units,
        limit_units = excluded.limit_units,
        updated_at = now()
    where public.provider_usage_daily.units + excluded.units <= excluded.limit_units;

  return found;
end;
$$;

revoke all on function public.reserve_google_places_requests(uuid, smallint, smallint)
  from public, anon, authenticated;
grant execute on function public.reserve_google_places_requests(uuid, smallint, smallint)
  to service_role;
