-- ============================================================
-- Trend Mart v2 - SECURITY HARDENING
-- ============================================================
-- The new React + Express app talks to Supabase ONLY through
-- your server (service_role key), so browsers no longer need
-- direct table access. Running this file removes the old
-- "anon can do everything" policies.
--
-- How to use:
--   1. Supabase Dashboard -> SQL Editor
--   2. Paste this file -> Run
--
-- Safe to re-run.
-- ⚠ Run this AFTER switching to the new app, since the legacy
--   static site (Index/) needs anon access to keep working.
-- ============================================================

-- Lock down tables: only service_role (your server) can touch them
drop policy if exists "anon all products" on public.products;
drop policy if exists "anon all orders" on public.orders;
drop policy if exists "anon all banners" on public.banners;
drop policy if exists "anon all popups" on public.popups;
drop policy if exists "anon all offers" on public.offers;
drop policy if exists "anon all chat_sessions" on public.chat_sessions;

revoke all on public.products    from anon;
revoke all on public.orders      from anon;
revoke all on public.banners     from anon;
revoke all on public.popups      from anon;
revoke all on public.offers      from anon;
revoke all on public.chat_sessions from anon;

-- Storage: images must stay publicly readable (used in <img> tags),
-- but anonymous WRITE access is removed. Uploads now go through
-- your server using the service key.
drop policy if exists "anon upload product-images" on storage.objects;
drop policy if exists "anon update product-images" on storage.objects;
drop policy if exists "anon delete product-images" on storage.objects;

revoke insert, update, delete on storage.objects from anon;

-- Keep public read for images
drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images"
    on storage.objects for select
    using (bucket_id = 'product-images');
