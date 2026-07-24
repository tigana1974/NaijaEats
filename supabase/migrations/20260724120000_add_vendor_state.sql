alter table public.vendors
  add column if not exists state text;

create index if not exists vendors_country_state_city_idx
  on public.vendors (country, state, city);
