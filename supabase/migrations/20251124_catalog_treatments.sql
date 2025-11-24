-- Catalog & Treatments schema (idempotent)
-- Date: 2025-11-24

-- Create medication_catalog: global catalog of medicine base data
create table if not exists public.medication_catalog (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  brand text,
  strength text not null,
  form text not null,
  dosage_unit text,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists medication_catalog_unq
  on public.medication_catalog (lower(generic_name), lower(coalesce(strength,'')), lower(form));

-- Create patient_medications: link a patient to catalog entries
create table if not exists public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  catalog_id uuid not null references public.medication_catalog(id) on delete restrict,
  alias text,
  created_at timestamptz not null default now()
);

create unique index if not exists patient_medications_unq
  on public.patient_medications (patient_id, catalog_id);

-- Create treatments: episodes with schedule configuration
create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  patient_medication_id uuid not null references public.patient_medications(id) on delete cascade,
  dosage text not null,
  frequency text not null,
  times_per_day int,
  specific_times text[],
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists treatments_active_idx on public.treatments (is_active);

-- dosage_schedules: add treatment_id (keep medication_id for compatibility)
alter table if exists public.dosage_schedules
  add column if not exists treatment_id uuid;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'dosage_schedules_treatment_id_fkey'
  ) then
    alter table public.dosage_schedules
      add constraint dosage_schedules_treatment_id_fkey
      foreign key (treatment_id) references public.treatments(id) on delete cascade;
  end if;
end $$;

create unique index if not exists dosage_schedules_unq_treatment_time
  on public.dosage_schedules (treatment_id, scheduled_time);

-- Trigger: mark treatments inactive when end_date passes
create or replace function public.treatments_set_inactive()
returns trigger as $$
begin
  if NEW.end_date is not null and NEW.end_date < current_date then
    NEW.is_active := false;
    NEW.status := 'finished';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_treatments_inactive on public.treatments;
create trigger trg_treatments_inactive
before insert or update on public.treatments
for each row execute function public.treatments_set_inactive();

-- Data migration from existing medications (best-effort, idempotent)
-- 1) Seed catalog from distinct (generic_name, strength, form)
with grouped as (
  select m.generic_name,
         max(m.brand) as brand,
         m.strength,
         m.form::text as form_text
  from public.medications m
  group by m.generic_name, m.strength, m.form
)
insert into public.medication_catalog (id, generic_name, brand, strength, form)
select gen_random_uuid(), g.generic_name, g.brand, g.strength, g.form_text
from grouped g
where not exists (
  select 1
  from public.medication_catalog c
  where lower(c.generic_name) = lower(g.generic_name)
    and lower(coalesce(c.strength,'')) = lower(coalesce(g.strength,''))
    and lower(c.form) = lower(g.form_text)
);

-- 2) Seed patient_medications linking patient -> catalog
insert into public.patient_medications (id, patient_id, catalog_id)
select gen_random_uuid(), m.patient_id, c.id
from public.medications m
join public.medication_catalog c
  on lower(c.generic_name)=lower(m.generic_name)
 and lower(coalesce(c.strength,''))=lower(coalesce(m.strength,''))
 and lower(c.form)=lower(m.form::text)
on conflict (patient_id, catalog_id) do nothing;

-- 3) Create treatments from current medications
insert into public.treatments (
  id, patient_medication_id, dosage, frequency, times_per_day, specific_times, start_date, end_date, is_active
)
select gen_random_uuid(), pm.id, m.dosage, m.frequency,
       coalesce(array_length(m.specific_times, 1), null) as times_per_day,
       m.specific_times,
       coalesce(m.start_date::date, current_date), m.end_date::date, m.is_active
from public.medications m
join public.medication_catalog c
  on lower(c.generic_name)=lower(m.generic_name)
 and lower(coalesce(c.strength,''))=lower(coalesce(m.strength,''))
 and lower(c.form)=lower(m.form::text)
join public.patient_medications pm
  on pm.patient_id=m.patient_id and pm.catalog_id=c.id
on conflict do nothing;

-- 4) Link dosage_schedules to treatments
update public.dosage_schedules ds
set treatment_id = t.id
from public.medications m
join public.medication_catalog c
  on lower(c.generic_name)=lower(m.generic_name)
 and lower(coalesce(c.strength,''))=lower(coalesce(m.strength,''))
 and lower(c.form)=lower(m.form::text)
join public.patient_medications pm on pm.patient_id = m.patient_id and pm.catalog_id = c.id
join public.treatments t on t.patient_medication_id = pm.id
where ds.medication_id = m.id
  and ds.treatment_id is null;

-- Notes:
-- - Keep existing unique index on (medication_id, scheduled_time) for current app compatibility.
-- - After code migration, prefer using treatment_id for schedules generation and adherence.
