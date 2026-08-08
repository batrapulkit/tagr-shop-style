-- 1. Create uploads table
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creators(id) on delete set null,
  storage_path text not null,
  processing_ms int,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.uploads to anon, authenticated;
grant all on public.uploads to service_role;
alter table public.uploads enable row level security;

create policy "prototype uploads insert" on public.uploads for insert to anon, authenticated with check (true);
create policy "prototype uploads select" on public.uploads for select to anon, authenticated using (true);
create policy "prototype uploads update" on public.uploads for update to anon, authenticated using (true) with check (true);

-- 2. Create detected_items table
create table if not exists public.detected_items (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads(id) on delete cascade,
  category text not null,
  name text not null,
  primary_color text,
  secondary_color text,
  pattern text,
  material_guess text,
  fit_or_style text,
  gender_presentation text,
  search_query text not null,
  confidence numeric,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.detected_items to anon, authenticated;
grant all on public.detected_items to service_role;
alter table public.detected_items enable row level security;

create policy "prototype detected_items insert" on public.detected_items for insert to anon, authenticated with check (true);
create policy "prototype detected_items select" on public.detected_items for select to anon, authenticated using (true);
create policy "prototype detected_items update" on public.detected_items for update to anon, authenticated using (true) with check (true);
create policy "prototype detected_items delete" on public.detected_items for delete to anon, authenticated using (true);

-- 3. Create affiliate_links table
create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  detected_item_id uuid references public.detected_items(id) on delete cascade,
  original_url text not null,
  short_code text unique not null,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.affiliate_links to anon, authenticated;
grant all on public.affiliate_links to service_role;
alter table public.affiliate_links enable row level security;

create policy "prototype affiliate_links insert" on public.affiliate_links for insert to anon, authenticated with check (true);
create policy "prototype affiliate_links select" on public.affiliate_links for select to anon, authenticated using (true);
create policy "prototype affiliate_links update" on public.affiliate_links for update to anon, authenticated using (true) with check (true);

-- 4. Create clicks table
create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.affiliate_links(id) on delete cascade,
  referrer text,
  user_agent text,
  hashed_ip text,
  created_at timestamptz not null default now()
);

grant select, insert on public.clicks to anon, authenticated;
grant all on public.clicks to service_role;
alter table public.clicks enable row level security;

create policy "prototype clicks insert" on public.clicks for insert to anon, authenticated with check (true);
create policy "prototype clicks select" on public.clicks for select to anon, authenticated using (true);

-- 5. Create commission_rates table
create table if not exists public.commission_rates (
  id uuid primary key default gen_random_uuid(),
  category text unique not null,
  rate_percent numeric not null,
  source_url text,
  verified_on date default current_date
);

grant select on public.commission_rates to anon, authenticated;
grant all on public.commission_rates to service_role;
alter table public.commission_rates enable row level security;

create policy "prototype commission_rates select" on public.commission_rates for select to anon, authenticated using (true);

-- Seed commission rates table (Amazon India Associates estimates)
insert into public.commission_rates (category, rate_percent) values
('apparel', 9.0),
('shoes', 9.0),
('jewellery', 9.0),
('watches', 9.0),
('luggage', 9.0),
('beauty', 7.0),
('personal_care', 6.0),
('other', 5.0)
on conflict (category) do update set rate_percent = excluded.rate_percent;

-- Create storage bucket for uploads if it database exists
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Create security policies for storage bucket
create policy "uploads public select"
  on storage.objects for select
  using ( bucket_id = 'uploads' );

create policy "uploads public insert"
  on storage.objects for insert
  with check ( bucket_id = 'uploads' );
