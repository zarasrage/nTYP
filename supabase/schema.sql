-- Esquema para la app de Registro de Pacientes.
-- Ejecutar en el SQL Editor de tu proyecto Supabase (https://app.supabase.com).
--
-- App de un solo uso, sin login: el acceso no se restringe por usuario,
-- así que la protección debe manejarse a nivel de despliegue (ver README).

create extension if not exists "pgcrypto";

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  full_name text not null,
  document_id text,
  birth_date date,
  sex text check (sex in ('M', 'F', 'Otro')),
  phone text,
  email text,
  address text,

  emergency_contact_name text,
  emergency_contact_phone text,

  blood_type text,
  allergies text,
  medical_notes text,

  in_followup boolean not null default true
);

create index if not exists patients_full_name_idx on public.patients using gin (to_tsvector('spanish', full_name));
create index if not exists patients_document_id_idx on public.patients (document_id);
create index if not exists patients_in_followup_idx on public.patients (in_followup);

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

drop policy if exists "Public can read patients" on public.patients;
create policy "Public can read patients"
  on public.patients for select
  to public
  using (true);

drop policy if exists "Public can insert patients" on public.patients;
create policy "Public can insert patients"
  on public.patients for insert
  to public
  with check (true);

drop policy if exists "Public can update patients" on public.patients;
create policy "Public can update patients"
  on public.patients for update
  to public
  using (true)
  with check (true);

drop policy if exists "Public can delete patients" on public.patients;
create policy "Public can delete patients"
  on public.patients for delete
  to public
  using (true);
