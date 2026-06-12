alter table public.snapquest_fighters
add column if not exists description text;

alter table public.snapquest_effect_cards
add column if not exists description text;
