-- Create otps table
create table if not exists public.otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  otp text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.otps to anon, authenticated;
grant all on public.otps to service_role;
alter table public.otps enable row level security;

create policy "prototype otps insert" on public.otps for insert to anon, authenticated with check (true);
create policy "prototype otps select" on public.otps for select to anon, authenticated using (true);
create policy "prototype otps update" on public.otps for update to anon, authenticated using (true) with check (true);
create policy "prototype otps delete" on public.otps for delete to anon, authenticated using (true);
