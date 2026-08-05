-- Migración: nuevo modelo de paciente (RUT, sexo, accidente, diagnósticos,
-- cirugías, hospitalizado) + tabla de alertas + catálogo de diagnósticos.
-- Pega y ejecuta esto completo en el SQL Editor de tu proyecto Supabase.

create extension if not exists "pgcrypto";

-- 1. Catálogo de diagnósticos
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

-- 2. Nuevos campos en patients
alter table public.patients
  add column if not exists rut text,
  add column if not exists age_at_accident integer,
  add column if not exists accident_date date,
  add column if not exists initial_diagnoses jsonb not null default '[]'::jsonb,
  add column if not exists initial_diagnoses_notes text,
  add column if not exists evolutive_diagnoses jsonb not null default '[]'::jsonb,
  add column if not exists evolutive_diagnoses_notes text,
  add column if not exists surgeries jsonb not null default '[]'::jsonb,
  add column if not exists hospitalized boolean not null default false;

-- Si venías del esquema anterior, conserva el RUT que estaba en document_id.
update public.patients
  set rut = document_id
  where rut is null and document_id is not null;

alter table public.patients
  drop column if exists document_id,
  drop column if exists birth_date,
  drop column if exists phone,
  drop column if exists email,
  drop column if exists address,
  drop column if exists emergency_contact_name,
  drop column if exists emergency_contact_phone,
  drop column if exists blood_type,
  drop column if exists allergies,
  drop column if exists medical_notes;

drop index if exists patients_document_id_idx;
create index if not exists patients_rut_idx on public.patients (rut);

-- 3. Tabla de alertas
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  type text not null check (type in ('seguimiento', 'curacion', 'control', 'cultivos_biopsia')),
  due_date date not null,
  note text
);

create index if not exists alerts_due_date_idx on public.alerts (due_date);
create index if not exists alerts_patient_id_idx on public.alerts (patient_id);

-- 4. RLS para las tablas nuevas (mismo criterio público que patients, sin login)
alter table public.alerts enable row level security;
alter table public.diagnosis_catalog enable row level security;

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
