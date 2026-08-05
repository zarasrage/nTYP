-- Esquema para la app de Registro de Pacientes.
-- Ejecutar en el SQL Editor de tu proyecto Supabase (https://app.supabase.com).

create extension if not exists "pgcrypto";

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),

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
  medical_notes text
);

create index if not exists patients_full_name_idx on public.patients using gin (to_tsvector('spanish', full_name));
create index if not exists patients_document_id_idx on public.patients (document_id);

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

-- Row Level Security: cualquier usuario autenticado (personal de la clínica)
-- puede leer y administrar los registros de pacientes. Si necesitas separar
-- por roles o consultorios, reemplaza estas políticas por reglas más finas.
alter table public.patients enable row level security;

drop policy if exists "Authenticated users can read patients" on public.patients;
create policy "Authenticated users can read patients"
  on public.patients for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert patients" on public.patients;
create policy "Authenticated users can insert patients"
  on public.patients for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update patients" on public.patients;
create policy "Authenticated users can update patients"
  on public.patients for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete patients" on public.patients;
create policy "Authenticated users can delete patients"
  on public.patients for delete
  to authenticated
  using (true);
