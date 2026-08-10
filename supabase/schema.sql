-- Esquema para la app de Registro de Pacientes (traumatología / seguimiento de accidentes).
-- Ejecutar en el SQL Editor de tu proyecto Supabase (https://app.supabase.com).
--
-- App de un solo uso, sin login: el acceso no se restringe por usuario,
-- así que la protección debe manejarse a nivel de despliegue (ver README).

create extension if not exists "pgcrypto";

-- Catálogo de diagnósticos TYP, administrable desde la app (sección
-- "Gestionar diagnósticos"), sin tocar código.
create table if not exists public.diagnosis_catalog (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.diagnosis_catalog (label) values
  ('Fractura tobillo'),
  ('Fractura lisfranc'),
  ('Fractura calcáneo'),
  ('Fractura talo'),
  ('Fractura peritalar'),
  ('Pie gravemente lesionado')
on conflict (label) do nothing;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  full_name text not null,
  rut text,
  sex text check (sex in ('M', 'F', 'Otro')),
  age_at_accident integer,
  accident_date date,

  -- Cada entrada: {"diagnosis": "Fractura tobillo", "laterality": "Der" | "Izq" | "Bilateral" | null}
  initial_diagnoses jsonb not null default '[]'::jsonb,
  initial_diagnoses_notes text,
  evolutive_diagnoses jsonb not null default '[]'::jsonb,
  evolutive_diagnoses_notes text,

  -- Cada entrada: {"date": "YYYY-MM-DD" | null, "notes": "texto libre"}
  surgeries jsonb not null default '[]'::jsonb,

  hospitalized boolean not null default false,
  in_followup boolean not null default true
);

create index if not exists patients_full_name_idx on public.patients using gin (to_tsvector('spanish', full_name));
create index if not exists patients_rut_idx on public.patients (rut);
create index if not exists patients_in_followup_idx on public.patients (in_followup);

-- Alertas por paciente: seguimiento, curación, control, cultivos/biopsia.
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  type text not null check (type in ('seguimiento', 'curacion', 'control', 'cultivos_biopsia')),
  due_date date not null,
  -- Hora opcional (hora de Chile, tal como la ingresa el usuario). Si es
  -- null, la alerta no dispara notificación push.
  due_time time,
  note text,
  completed boolean not null default false,
  -- Se marca cuando ya se envió la notificación push de esta alerta, para
  -- no volver a enviarla.
  notified_at timestamptz
);

create index if not exists alerts_due_date_idx on public.alerts (due_date);
create index if not exists alerts_patient_id_idx on public.alerts (patient_id);
create index if not exists alerts_completed_idx on public.alerts (completed);

-- Suscripciones push (una por dispositivo instalado) para las notificaciones
-- de alertas próximas.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null
);

-- Mantener updated_at al día en cada edición.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

-- Row Level Security: sin login, así que se permite el acceso público
-- (a través de la anon key). La protección de la app se maneja a nivel
-- de despliegue (contraseña de sitio en Netlify, por ejemplo).
alter table public.patients enable row level security;
alter table public.alerts enable row level security;
alter table public.diagnosis_catalog enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Public can read patients" on public.patients;
create policy "Public can read patients" on public.patients for select to public using (true);
drop policy if exists "Public can insert patients" on public.patients;
create policy "Public can insert patients" on public.patients for insert to public with check (true);
drop policy if exists "Public can update patients" on public.patients;
create policy "Public can update patients" on public.patients for update to public using (true) with check (true);
drop policy if exists "Public can delete patients" on public.patients;
create policy "Public can delete patients" on public.patients for delete to public using (true);

drop policy if exists "Public can read alerts" on public.alerts;
create policy "Public can read alerts" on public.alerts for select to public using (true);
drop policy if exists "Public can insert alerts" on public.alerts;
create policy "Public can insert alerts" on public.alerts for insert to public with check (true);
drop policy if exists "Public can update alerts" on public.alerts;
create policy "Public can update alerts" on public.alerts for update to public using (true) with check (true);
drop policy if exists "Public can delete alerts" on public.alerts;
create policy "Public can delete alerts" on public.alerts for delete to public using (true);

drop policy if exists "Public can read diagnosis_catalog" on public.diagnosis_catalog;
create policy "Public can read diagnosis_catalog" on public.diagnosis_catalog for select to public using (true);
drop policy if exists "Public can insert diagnosis_catalog" on public.diagnosis_catalog;
create policy "Public can insert diagnosis_catalog" on public.diagnosis_catalog for insert to public with check (true);
drop policy if exists "Public can update diagnosis_catalog" on public.diagnosis_catalog;
create policy "Public can update diagnosis_catalog" on public.diagnosis_catalog for update to public using (true) with check (true);

drop policy if exists "Public can read push_subscriptions" on public.push_subscriptions;
create policy "Public can read push_subscriptions" on public.push_subscriptions for select to public using (true);
drop policy if exists "Public can insert push_subscriptions" on public.push_subscriptions;
create policy "Public can insert push_subscriptions" on public.push_subscriptions for insert to public with check (true);
drop policy if exists "Public can update push_subscriptions" on public.push_subscriptions;
create policy "Public can update push_subscriptions" on public.push_subscriptions for update to public using (true) with check (true);
drop policy if exists "Public can delete push_subscriptions" on public.push_subscriptions;
create policy "Public can delete push_subscriptions" on public.push_subscriptions for delete to public using (true);
