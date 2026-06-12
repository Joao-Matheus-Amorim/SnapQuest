-- SnapQuest MVP schema
-- Execute no SQL Editor do Supabase.
-- Usa Auth + RLS: cada usuário acessa apenas seu próprio inventário.

create extension if not exists "pgcrypto";

create table if not exists public.snapquest_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  player2_name text,
  can_manage_catalog boolean not null default false,
  xp integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.snapquest_fighters (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_data_url text,
  photo_storage_path text,
  photo_fake text,
  class_key text not null,
  class_name text not null,
  icon text,
  description text,
  signature_move text,
  signature_miss text,
  hp integer not null check (hp > 0),
  atk integer not null check (atk >= 0),
  def integer not null check (def >= 0),
  lck integer not null check (lck >= 0),
  spd integer not null check (spd >= 0),
  bonus_attribute text not null,
  bonus_intensity integer not null check (bonus_intensity between 1 and 5),
  is_catalog boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.snapquest_effect_cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_data_url text,
  photo_storage_path text,
  photo_fake text,
  category_key text not null,
  category_name text not null,
  icon text,
  description text,
  polarity text not null check (polarity in ('BÔNUS', 'DEBUFF')),
  attribute text not null check (attribute in ('ATK', 'DEF', 'LCK', 'SPD', 'HP', 'MANA')),
  intensity integer not null check (intensity between 1 and 5),
  rarity text not null,
  is_catalog boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.snapquest_profiles
add column if not exists can_manage_catalog boolean not null default false;

alter table public.snapquest_fighters
add column if not exists is_catalog boolean not null default false;

alter table public.snapquest_fighters
add column if not exists photo_storage_path text;

alter table public.snapquest_fighters
add column if not exists description text;

alter table public.snapquest_fighters
add column if not exists signature_move text;

alter table public.snapquest_fighters
add column if not exists signature_miss text;

alter table public.snapquest_effect_cards
add column if not exists is_catalog boolean not null default false;

alter table public.snapquest_effect_cards
add column if not exists photo_storage_path text;

alter table public.snapquest_effect_cards
add column if not exists description text;

create index if not exists snapquest_fighters_user_id_idx
on public.snapquest_fighters (user_id);

create index if not exists snapquest_fighters_catalog_idx
on public.snapquest_fighters (is_catalog, created_at);

create index if not exists snapquest_effect_cards_user_id_idx
on public.snapquest_effect_cards (user_id);

create index if not exists snapquest_effect_cards_catalog_idx
on public.snapquest_effect_cards (is_catalog, created_at);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'snapquest-photos',
  'snapquest-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.snapquest_battle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opponent_type text not null default 'local',
  result text not null,
  winner_name text,
  turns_total integer,
  damage_total integer,
  epic_moment text,
  created_at timestamptz not null default now()
);

alter table public.snapquest_profiles enable row level security;
alter table public.snapquest_fighters enable row level security;
alter table public.snapquest_effect_cards enable row level security;
alter table public.snapquest_battle_logs enable row level security;

drop policy if exists "profiles_select_own" on public.snapquest_profiles;
drop policy if exists "profiles_insert_own" on public.snapquest_profiles;
drop policy if exists "profiles_update_own" on public.snapquest_profiles;
drop policy if exists "fighters_select_own" on public.snapquest_fighters;
drop policy if exists "fighters_select_catalog_public" on public.snapquest_fighters;
drop policy if exists "fighters_insert_own" on public.snapquest_fighters;
drop policy if exists "fighters_update_own" on public.snapquest_fighters;
drop policy if exists "fighters_delete_own" on public.snapquest_fighters;
drop policy if exists "cards_select_own" on public.snapquest_effect_cards;
drop policy if exists "cards_select_catalog_public" on public.snapquest_effect_cards;
drop policy if exists "cards_insert_own" on public.snapquest_effect_cards;
drop policy if exists "cards_update_own" on public.snapquest_effect_cards;
drop policy if exists "cards_delete_own" on public.snapquest_effect_cards;
drop policy if exists "battle_logs_select_own" on public.snapquest_battle_logs;
drop policy if exists "battle_logs_insert_own" on public.snapquest_battle_logs;
drop policy if exists "snapquest_photos_select_authenticated" on storage.objects;
drop policy if exists "snapquest_photos_select_catalog_public" on storage.objects;
drop policy if exists "snapquest_photos_insert_authenticated" on storage.objects;
drop policy if exists "snapquest_photos_update_authenticated" on storage.objects;
drop policy if exists "snapquest_photos_delete_authenticated" on storage.objects;

create policy "profiles_select_own"
on public.snapquest_profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.snapquest_profiles for insert
to authenticated
with check (
  (select auth.uid()) = id
  and can_manage_catalog = false
);

create policy "profiles_update_own"
on public.snapquest_profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke update (can_manage_catalog)
on public.snapquest_profiles
from anon, authenticated;

create or replace function public.snapquest_guard_catalog_admin_flag()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated')
    and new.can_manage_catalog is distinct from old.can_manage_catalog
  then
    raise exception 'can_manage_catalog can only be changed by an administrative database role';
  end if;

  return new;
end;
$$;

drop trigger if exists snapquest_profiles_guard_catalog_admin_flag on public.snapquest_profiles;
create trigger snapquest_profiles_guard_catalog_admin_flag
before update on public.snapquest_profiles
for each row execute function public.snapquest_guard_catalog_admin_flag();

create policy "fighters_select_own"
on public.snapquest_fighters for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "fighters_select_catalog_public"
on public.snapquest_fighters for select
to anon, authenticated
using (
  is_catalog = true
);

create policy "fighters_insert_own"
on public.snapquest_fighters for insert
to authenticated
with check (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    (select auth.uid()) = user_id
    and is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
);

create policy "fighters_update_own"
on public.snapquest_fighters for update
to authenticated
using (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
)
with check (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    (select auth.uid()) = user_id
    and is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
);

create policy "fighters_delete_own"
on public.snapquest_fighters for delete
to authenticated
using (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
);

create policy "cards_select_own"
on public.snapquest_effect_cards for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "cards_select_catalog_public"
on public.snapquest_effect_cards for select
to anon, authenticated
using (
  is_catalog = true
);

create policy "cards_insert_own"
on public.snapquest_effect_cards for insert
to authenticated
with check (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    (select auth.uid()) = user_id
    and is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
);

create policy "cards_update_own"
on public.snapquest_effect_cards for update
to authenticated
using (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
)
with check (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    (select auth.uid()) = user_id
    and is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
);

create policy "cards_delete_own"
on public.snapquest_effect_cards for delete
to authenticated
using (
  (
    (select auth.uid()) = user_id
    and is_catalog = false
  )
  or (
    is_catalog = true
    and exists (
      select 1
      from public.snapquest_profiles
      where id = (select auth.uid())
        and can_manage_catalog = true
    )
  )
);

create policy "battle_logs_select_own"
on public.snapquest_battle_logs for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "battle_logs_insert_own"
on public.snapquest_battle_logs for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "snapquest_photos_select_authenticated"
on storage.objects for select
to authenticated
using (
  bucket_id = 'snapquest-photos'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = ((select auth.uid())::text)
);

create policy "snapquest_photos_select_catalog_public"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'snapquest-photos'
  and (storage.foldername(name))[1] = 'catalog'
);

create policy "snapquest_photos_insert_authenticated"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'snapquest-photos'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = ((select auth.uid())::text)
    )
    or (
      (storage.foldername(name))[1] = 'catalog'
      and exists (
        select 1
        from public.snapquest_profiles
        where id = (select auth.uid())
          and can_manage_catalog = true
      )
    )
  )
);

create policy "snapquest_photos_update_authenticated"
on storage.objects for update
to authenticated
using (
  bucket_id = 'snapquest-photos'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = ((select auth.uid())::text)
    )
    or (
      (storage.foldername(name))[1] = 'catalog'
      and exists (
        select 1
        from public.snapquest_profiles
        where id = (select auth.uid())
          and can_manage_catalog = true
      )
    )
  )
)
with check (
  bucket_id = 'snapquest-photos'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = ((select auth.uid())::text)
    )
    or (
      (storage.foldername(name))[1] = 'catalog'
      and exists (
        select 1
        from public.snapquest_profiles
        where id = (select auth.uid())
          and can_manage_catalog = true
      )
    )
  )
);

create policy "snapquest_photos_delete_authenticated"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'snapquest-photos'
  and (
    (
      (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = ((select auth.uid())::text)
    )
    or (
      (storage.foldername(name))[1] = 'catalog'
      and exists (
        select 1
        from public.snapquest_profiles
        where id = (select auth.uid())
          and can_manage_catalog = true
      )
    )
  )
);

create or replace function public.snapquest_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists snapquest_profiles_touch_updated_at on public.snapquest_profiles;
create trigger snapquest_profiles_touch_updated_at
before update on public.snapquest_profiles
for each row execute function public.snapquest_touch_updated_at();

drop trigger if exists snapquest_fighters_touch_updated_at on public.snapquest_fighters;
create trigger snapquest_fighters_touch_updated_at
before update on public.snapquest_fighters
for each row execute function public.snapquest_touch_updated_at();

drop trigger if exists snapquest_effect_cards_touch_updated_at on public.snapquest_effect_cards;
create trigger snapquest_effect_cards_touch_updated_at
before update on public.snapquest_effect_cards
for each row execute function public.snapquest_touch_updated_at();
