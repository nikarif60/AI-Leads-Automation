create unique index if not exists telegram_notifications_owner_lead_uidx
  on public.telegram_notifications (owner_id, lead_id);
