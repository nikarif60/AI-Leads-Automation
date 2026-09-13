create table public.app_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  country_code text not null default 'MY' check (country_code = 'MY'),
  scan_enabled boolean not null default false,
  scan_interval_hours smallint not null default 3 check (scan_interval_hours = 3),
  active_niches text[] not null default array[
    'corporate_services', 'renovation_interior', 'property_homestay',
    'salon_barber', 'automotive', 'cafe_restaurant'
  ],
  active_location_batches jsonb not null default '[]'::jsonb,
  minimum_lead_score smallint not null default 40 check (minimum_lead_score between 0 and 100),
  telegram_threshold smallint not null default 75 check (telegram_threshold between 0 and 100),
  max_alerts_per_scan smallint not null default 5 check (max_alerts_per_scan between 1 and 5),
  daily_spend_limit_usd numeric(8,2) not null default 0 check (daily_spend_limit_usd >= 0),
  daily_digest_time time not null default '21:00',
  cooldown_days smallint not null default 90 check (cooldown_days >= 30),
  preferred_language text not null default 'auto' check (preferred_language in ('auto', 'en', 'bm')),
  outreach_signature text not null default '',
  telegram_chat_id text,
  scoring_weights jsonb not null default '{
    "no_official_website": 25,
    "recent_reviews": 15,
    "priority_niche": 15,
    "phone_available": 10,
    "active_social_branding": 10,
    "multiple_branches_or_high_value": 10,
    "clear_website_gap": 10,
    "growth_signal": 5
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  google_place_id text,
  normalized_phone text,
  website_domain text,
  normalized_name text not null,
  normalized_address text not null,
  business_name text not null,
  niche text not null,
  city text not null,
  state text not null,
  country_code text not null default 'MY' check (country_code = 'MY'),
  address text not null,
  phone text,
  whatsapp_number text,
  website_url text,
  social_urls jsonb not null default '[]'::jsonb,
  website_status text not null check (website_status in ('no_website', 'social_only', 'outdated', 'good_website')),
  score smallint not null check (score between 0 and 100),
  status text not null default 'new' check (status in (
    'new', 'qualified', 'draft_ready', 'contacted', 'replied',
    'meeting', 'won', 'lost', 'skip', 'blacklist'
  )),
  opportunity_summary text not null,
  research_summary text not null,
  evidence jsonb not null default '[]'::jsonb,
  suggested_scope jsonb not null default '[]'::jsonb,
  draft_en text,
  draft_bm text,
  source_urls jsonb not null default '[]'::jsonb,
  discovered_at timestamptz not null default now(),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_notified_at timestamptz,
  contacted_at timestamptz,
  cooldown_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  check (status not in ('contacted', 'skip') or cooldown_until is not null)
);

create unique index leads_owner_place_uidx on public.leads (owner_id, google_place_id)
  where google_place_id is not null;
create unique index leads_owner_phone_uidx on public.leads (owner_id, normalized_phone)
  where normalized_phone is not null;
create unique index leads_owner_domain_uidx on public.leads (owner_id, website_domain)
  where website_domain is not null;
create unique index leads_owner_name_address_uidx on public.leads (owner_id, normalized_name, normalized_address);
create index leads_owner_status_score_idx on public.leads (owner_id, status, score desc);
create index leads_owner_last_seen_idx on public.leads (owner_id, last_seen_at desc);

create table public.lead_score_reasons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null,
  signal text not null,
  points smallint not null check (points between -100 and 100),
  evidence_text text not null,
  source_url text,
  created_at timestamptz not null default now(),
  foreign key (lead_id, owner_id) references public.leads(id, owner_id) on delete cascade
);
create index lead_score_reasons_owner_lead_idx on public.lead_score_reasons (owner_id, lead_id);

create table public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  github_run_id text,
  status text not null default 'idle' check (status in (
    'idle', 'running', 'completed_with_leads', 'completed_no_leads', 'failed'
  )),
  niche text not null,
  cities text[] not null,
  phase text,
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  leads_scanned integer not null default 0 check (leads_scanned >= 0),
  new_unique_leads integer not null default 0 check (new_unique_leads >= 0),
  qualified_leads integer not null default 0 check (qualified_leads >= 0),
  notifications_sent integer not null default 0 check (notifications_sent between 0 and 5),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create unique index scan_jobs_owner_github_run_uidx on public.scan_jobs (owner_id, github_run_id)
  where github_run_id is not null;
create index scan_jobs_owner_created_idx on public.scan_jobs (owner_id, created_at desc);

create table public.scan_job_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scan_job_id uuid not null,
  level text not null check (level in ('info', 'warning', 'error')),
  phase text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (scan_job_id, owner_id) references public.scan_jobs(id, owner_id) on delete cascade
);
create index scan_job_events_owner_job_idx on public.scan_job_events (owner_id, scan_job_id, created_at);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null,
  event_type text not null check (event_type in (
    'discovered', 'notified', 'dashboard_opened', 'whatsapp_opened',
    'contacted', 'replied', 'follow_up', 'status_changed', 'outcome'
  )),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (lead_id, owner_id) references public.leads(id, owner_id) on delete cascade
);
create index lead_activities_owner_lead_idx on public.lead_activities (owner_id, lead_id, created_at desc);

create table public.telegram_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null,
  scan_job_id uuid,
  telegram_message_id text,
  delivery_status text not null default 'queued' check (delivery_status in ('queued', 'sent', 'failed')),
  owner_action text not null default 'none' check (owner_action in ('none', 'dashboard_opened', 'whatsapp_opened', 'skipped')),
  sent_at timestamptz,
  action_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  foreign key (lead_id, owner_id) references public.leads(id, owner_id) on delete cascade,
  foreign key (scan_job_id, owner_id) references public.scan_jobs(id, owner_id) on delete set null (scan_job_id)
);
create index telegram_notifications_owner_created_idx on public.telegram_notifications (owner_id, created_at desc);

create table public.provider_usage_daily (
  owner_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  provider text not null,
  metric text not null,
  units integer not null default 0 check (units >= 0),
  estimated_cost_usd numeric(10,4) not null default 0 check (estimated_cost_usd >= 0),
  limit_units integer check (limit_units is null or limit_units >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, usage_date, provider, metric)
);

alter table public.app_settings enable row level security;
alter table public.leads enable row level security;
alter table public.lead_score_reasons enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.scan_job_events enable row level security;
alter table public.lead_activities enable row level security;
alter table public.telegram_notifications enable row level security;
alter table public.provider_usage_daily enable row level security;

revoke all on table public.app_settings, public.leads, public.lead_score_reasons,
  public.scan_jobs, public.scan_job_events, public.lead_activities,
  public.telegram_notifications, public.provider_usage_daily from anon, authenticated;

grant select, insert, update on table public.app_settings to authenticated;
grant select, update on table public.leads to authenticated;
grant select on table public.lead_score_reasons, public.scan_jobs,
  public.scan_job_events, public.provider_usage_daily to authenticated;
grant select, insert on table public.lead_activities to authenticated;
grant select, update on table public.telegram_notifications to authenticated;

grant all privileges on table public.app_settings, public.leads, public.lead_score_reasons,
  public.scan_jobs, public.scan_job_events, public.lead_activities,
  public.telegram_notifications, public.provider_usage_daily to service_role;

create policy "Owner reads settings" on public.app_settings for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owner creates settings" on public.app_settings for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Owner updates settings" on public.app_settings for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owner reads leads" on public.leads for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owner updates leads" on public.leads for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owner reads score reasons" on public.lead_score_reasons for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owner reads scan jobs" on public.scan_jobs for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owner reads scan events" on public.scan_job_events for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owner reads activities" on public.lead_activities for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owner creates activities" on public.lead_activities for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owner reads Telegram activity" on public.telegram_notifications for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owner updates Telegram activity" on public.telegram_notifications for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "Owner reads provider usage" on public.provider_usage_daily for select to authenticated
  using ((select auth.uid()) = owner_id);
