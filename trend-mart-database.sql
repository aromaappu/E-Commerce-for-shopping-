-- ============================================================
-- Trend Mart - Complete Database Setup (Supabase)
-- Creates all tables, indexes, RLS policies, the tracking RPC,
-- the product-images storage bucket and storage policies.
--
-- How to use:
--   1. Open your Supabase project -> SQL Editor
--   2. Paste this entire file and click "Run"
--   3. (Optional) node seed-db.js to upload product images
--      and fill the products table
--
-- Safe to re-run: every statement is idempotent.
-- The current app uses the server-side service key, so the RLS
-- policies below deny anonymous access.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ------------------------------------------------------------
-- products : all items shown on the customer site
-- ------------------------------------------------------------
create table if not exists public.products (
    id            uuid primary key default gen_random_uuid(),
    product_code  text not null unique,
    name          text not null,
    price         text not null default '',
    mrp           text not null default '',
    description   text not null default '',
    image_url     text not null default '',
    category      text not null default 'misc',
    out_of_stock  boolean not null default false,
    offer_percent numeric not null default 0,
    sort_order    integer not null default 0,
    created_at    timestamptz not null default now()
);

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_sort on public.products (sort_order);

-- ------------------------------------------------------------
-- orders : every order placed from the customer site / admin
-- ------------------------------------------------------------
create table if not exists public.orders (
    id                     uuid primary key default gen_random_uuid(),
    tracking_code          text not null unique,
    customer_name          text not null default '',
    customer_phone         text not null default '',
    customer_address       text not null default '',
    items                  jsonb not null default '[]'::jsonb,
    total                  numeric not null default 0,
    status                 text not null default 'Order Placed',
    status_history         jsonb not null default '[]'::jsonb,
    order_time             timestamptz not null default now(),
    whatsapp_redirect_time timestamptz not null default now(),
    created_at             timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created on public.orders (created_at);

-- ------------------------------------------------------------
-- banners : image carousel / strip shown on the customer site
-- ------------------------------------------------------------
create table if not exists public.banners (
    id         uuid primary key default gen_random_uuid(),
    title      text not null default 'Banner',
    image_url  text not null default '',
    sort_order integer not null default 0,
    active     boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_banners_sort on public.banners (sort_order);

-- ------------------------------------------------------------
-- popups : festival / popup posters shown on site open
-- ------------------------------------------------------------
create table if not exists public.popups (
    id         uuid primary key default gen_random_uuid(),
    title      text not null default 'Poster',
    link       text not null default '',
    image_url  text not null default '',
    active     boolean not null default true,
    start_date timestamptz,
    end_date   timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_popups_active on public.popups (active, start_date, end_date);

-- ------------------------------------------------------------
-- offers : announcement bar (⭐ ...) shown at the top of the site
-- ------------------------------------------------------------
create table if not exists public.offers (
    id          uuid primary key default gen_random_uuid(),
    title       text not null default '',
    description text not null default '',
    active      boolean not null default true,
    created_at  timestamptz not null default now()
);

-- ============================================================
-- 3. ROW LEVEL SECURITY: only service_role may read/write
-- ============================================================
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.banners enable row level security;
alter table public.popups enable row level security;
alter table public.offers enable row level security;

drop policy if exists "anon all products" on public.products;
drop policy if exists "anon all orders" on public.orders;
drop policy if exists "anon all banners" on public.banners;
drop policy if exists "anon all popups" on public.popups;
drop policy if exists "anon all offers" on public.offers;

revoke all on public.products from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.banners from anon, authenticated;
revoke all on public.popups from anon, authenticated;
revoke all on public.offers from anon, authenticated;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  messages jsonb not null default '[]'::jsonb,
  state jsonb not null default '{}'::jsonb,
  last_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.chat_sessions add column if not exists state jsonb not null default '{}'::jsonb;
alter table public.chat_sessions enable row level security;
drop policy if exists "anon all chat_sessions" on public.chat_sessions;
revoke all on public.chat_sessions from anon, authenticated;

-- 4. TRACKING RPC
-- ------------------------------------------------------------
-- get_order_by_code(tracking_code) -> single order row
-- Used by Index/track.html (falls back to a direct query if
-- this function is missing).
-- ============================================================
create or replace function public.get_order_by_code(code text)
returns setof public.orders
language sql
stable
as $$
    select *
    from public.orders
    where tracking_code = code
    limit 1;
$$;

revoke execute on function public.get_order_by_code(text) from public, anon, authenticated;
grant execute on function public.get_order_by_code(text) to service_role;

-- ============================================================
-- 5. STORAGE: public image reads; upload only through the server
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
drop policy if exists "anon upload product-images" on storage.objects;
drop policy if exists "anon update product-images" on storage.objects;
drop policy if exists "anon delete product-images" on storage.objects;
drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');

-- 6. OPTIONAL SEED DATA
-- ------------------------------------------------------------
-- A sample offer bar entry. Delete this block if you do not
-- want the announcement bar visible on the site.
-- ============================================================
insert into public.offers (title, description, active)
values ('Welcome to Trend Mart', 'Flat offers on bags, shoes, watches and more', true)
on conflict do nothing;

-- ============================================================
-- Done. You can now verify with:
--   select count(*) from public.products;  -- 0 (run seed-db.js)
--   select count(*) from public.orders;     -- 0
-- ============================================================
