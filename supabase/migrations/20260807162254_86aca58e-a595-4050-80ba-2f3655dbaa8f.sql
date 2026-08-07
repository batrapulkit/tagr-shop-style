create table public.creators (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  instagram_handle text,
  follower_count int,
  consent_given boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.creators to anon, authenticated;
grant all on public.creators to service_role;
alter table public.creators enable row level security;
create policy "prototype creators insert" on public.creators for insert to anon, authenticated with check (true);
create policy "prototype creators select" on public.creators for select to anon, authenticated using (true);
create policy "prototype creators update" on public.creators for update to anon, authenticated using (true) with check (true);

create table public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  phone text,
  step text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.funnel_events to anon, authenticated;
grant all on public.funnel_events to service_role;
alter table public.funnel_events enable row level security;
create policy "anon can log funnel events" on public.funnel_events for insert to anon, authenticated with check (true);
create policy "funnel events readable" on public.funnel_events for select to anon, authenticated using (true);
create index funnel_events_step_idx on public.funnel_events (step, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creators(id) on delete set null,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_paise int,
  status text not null default 'created',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.payments to anon, authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;
create policy "prototype payments insert" on public.payments for insert to anon, authenticated with check (true);
create policy "prototype payments select" on public.payments for select to anon, authenticated using (true);
create policy "prototype payments update" on public.payments for update to anon, authenticated using (true) with check (true);