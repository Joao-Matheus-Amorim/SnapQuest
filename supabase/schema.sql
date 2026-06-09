-- SnapQuest MVP schema
-- Execute no SQL Editor do Supabase.
-- Usa Auth + RLS: cada usuário acessa apenas seu próprio inventário.

create extension if not exists "pgcrypto";

create table if not exists public.snapquest_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  player2_name text,
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
  photo_fake text,
  class_key text not null,
  class_name text not null,
  icon text,
  hp integer not null check (hp > 0),
  atk integer not null check (atk >= 0),
  def integer not null check (def >= 0),
  lck integer not null check (lck >= 0),
  spd integer not null check (spd >= 0),
  bonus_attribute text not null,
  bonus_intensity integer not null check (bonus_intensity between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.snapquest_effect_cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_data_url text,
  photo_fake text,
  category_key text not null,
  category_name text not null,
  icon text,
  polarity text not null check (polarity in ('BÔNUS', 'DEBUFF')),
  attribute text not null check (attribute in ('ATK', 'DEF', 'LCK', 'SPD', 'HP', 'MANA')),
  intensity integer not null check (intensity between 1 and 5),
  rarity text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
drop policy if exists "fighters_insert_own" on public.snapquest_fighters;
drop policy if exists "fighters_update_own" on public.snapquest_fighters;
drop policy if exists "fighters_delete_own" on public.snapquest_fighters;
drop policy if exists "cards_select_own" on public.snapquest_effect_cards;
drop policy if exists "cards_insert_own" on public.snapquest_effect_cards;
drop policy if exists "cards_update_own" on public.snapquest_effect_cards;
drop policy if exists "cards_delete_own" on public.snapquest_effect_cards;
drop policy if exists "battle_logs_select_own" on public.snapquest_battle_logs;
drop policy if exists "battle_logs_insert_own" on public.snapquest_battle_logs;

create policy "profiles_select_own"
on public.snapquest_profiles for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.snapquest_profiles for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.snapquest_profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "fighters_select_own"
on public.snapquest_fighters for select
using (auth.uid() = user_id);

create policy "fighters_insert_own"
on public.snapquest_fighters for insert
with check (auth.uid() = user_id);

create policy "fighters_update_own"
on public.snapquest_fighters for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "fighters_delete_own"
on public.snapquest_fighters for delete
using (auth.uid() = user_id);

create policy "cards_select_own"
on public.snapquest_effect_cards for select
using (auth.uid() = user_id);

create policy "cards_insert_own"
on public.snapquest_effect_cards for insert
with check (auth.uid() = user_id);

create policy "cards_update_own"
on public.snapquest_effect_cards for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "cards_delete_own"
on public.snapquest_effect_cards for delete
using (auth.uid() = user_id);

create policy "battle_logs_select_own"
on public.snapquest_battle_logs for select
using (auth.uid() = user_id);

create policy "battle_logs_insert_own"
on public.snapquest_battle_logs for insert
with check (auth.uid() = user_id);

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
