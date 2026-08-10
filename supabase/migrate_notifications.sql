-- Migración incremental para el proyecto Supabase ya existente: agrega
-- soporte de hora en las alertas y la tabla de suscripciones push.
-- Pégalo en el SQL Editor de tu proyecto (app.supabase.com) y ejecútalo una vez.
-- (El contenido ya está incorporado a supabase/schema.sql para instalaciones nuevas.)

alter table public.alerts add column if not exists due_time time;
alter table public.alerts add column if not exists notified_at timestamptz;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Public can read push_subscriptions" on public.push_subscriptions;
create policy "Public can read push_subscriptions" on public.push_subscriptions for select to public using (true);
drop policy if exists "Public can insert push_subscriptions" on public.push_subscriptions;
create policy "Public can insert push_subscriptions" on public.push_subscriptions for insert to public with check (true);
drop policy if exists "Public can update push_subscriptions" on public.push_subscriptions;
create policy "Public can update push_subscriptions" on public.push_subscriptions for update to public using (true) with check (true);
drop policy if exists "Public can delete push_subscriptions" on public.push_subscriptions;
create policy "Public can delete push_subscriptions" on public.push_subscriptions for delete to public using (true);
