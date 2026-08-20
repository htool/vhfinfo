-- VHFinfo feature documents (shadow copy of data/{CC}.json).
-- Run this once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/imgadhoivcpexrferorn/sql/new
--
-- The website map reads this table. GitHub GeoJSON is the fallback.
-- Outlines and 12 Nm files stay in git.
--
-- Public can SELECT. Signed-in users can INSERT/UPDATE/DELETE.
-- Do not grant write to anon. Do not put the service_role key in the website.

create table if not exists public.vhf_features (
  id uuid primary key,
  country text not null,
  name text,
  type text,
  channel text,
  properties jsonb not null default '{}'::jsonb,
  geometry jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create index if not exists vhf_features_country_idx on public.vhf_features (country);
create index if not exists vhf_features_type_idx on public.vhf_features (type);

create or replace function public.vhf_features_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vhf_features_set_updated_at on public.vhf_features;
create trigger vhf_features_set_updated_at
before update on public.vhf_features
for each row
execute procedure public.vhf_features_set_updated_at();

alter table public.vhf_features enable row level security;

drop policy if exists "Public can read VHF features" on public.vhf_features;
create policy "Public can read VHF features"
on public.vhf_features
for select
using (true);

drop policy if exists "Signed-in users can insert VHF features" on public.vhf_features;
create policy "Signed-in users can insert VHF features"
on public.vhf_features
for insert
to authenticated
with check (true);

drop policy if exists "Signed-in users can update VHF features" on public.vhf_features;
create policy "Signed-in users can update VHF features"
on public.vhf_features
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Signed-in users can delete VHF features" on public.vhf_features;
create policy "Signed-in users can delete VHF features"
on public.vhf_features
for delete
to authenticated
using (true);

grant select on public.vhf_features to anon, authenticated;
grant insert, update, delete on public.vhf_features to authenticated;
grant all on public.vhf_features to service_role;

comment on table public.vhf_features is
  'Shadow copy of VHF GeoJSON features. Map still reads GitHub until a later step.';
