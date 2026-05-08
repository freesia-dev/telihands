
-- Roles
create type public.app_role as enum ('admin', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Auto profile + first user becomes admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  if (select count(*) from public.user_roles where role = 'admin') = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'viewer');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create policy "Profiles: own select" on public.profiles for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "Profiles: own update" on public.profiles for update using (auth.uid() = id);
create policy "Roles: self read" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Roles: admin manage" on public.user_roles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Content tables
create table public.savings_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  interest_rate numeric(6,3) not null default 0,
  min_balance numeric(14,2) not null default 0,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.savings_products enable row level security;

create table public.deposito_rates (
  id uuid primary key default gen_random_uuid(),
  tenor_months int not null,
  interest_rate numeric(6,3) not null default 0,
  min_amount numeric(14,2) not null default 0,
  is_promo boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.deposito_rates enable row level security;

create table public.running_text (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.running_text enable row level security;

create table public.media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  file_url text not null,
  media_type text not null check (media_type in ('image','video')),
  duration_seconds int not null default 8,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;

-- Public read of active rows; admin full
create policy "sp public read" on public.savings_products for select using (true);
create policy "sp admin all" on public.savings_products for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "dp public read" on public.deposito_rates for select using (true);
create policy "dp admin all" on public.deposito_rates for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "rt public read" on public.running_text for select using (true);
create policy "rt admin all" on public.running_text for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "media public read" on public.media for select using (true);
create policy "media admin all" on public.media for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Storage
insert into storage.buckets (id, name, public) values ('media','media', true);
create policy "media storage public read" on storage.objects for select using (bucket_id = 'media');
create policy "media storage admin write" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "media storage admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "media storage admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));

-- Seeds
insert into public.savings_products (name, interest_rate, sort_order) values
  ('Tabungan Prama', 2.50, 1),
  ('Tabungan Simpeda', 2.00, 2),
  ('Tabungan TabunganKu', 1.00, 3),
  ('Tabungan SimPel', 1.50, 4),
  ('Giro', 0.75, 5);

insert into public.deposito_rates (tenor_months, interest_rate, min_amount, sort_order) values
  (1, 4.25, 8000000, 1),
  (3, 4.50, 8000000, 2),
  (6, 4.75, 8000000, 3),
  (12, 5.00, 8000000, 4);

insert into public.running_text (content, sort_order) values
  ('Selamat datang di Bank KCP Telihan — Inform • Engage • Inspire', 1),
  ('Nikmati suku bunga deposito hingga 5.00% p.a. Syarat & ketentuan berlaku.', 2);
