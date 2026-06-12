alter table public.snapquest_fighters
add column if not exists signature_move text;

alter table public.snapquest_fighters
add column if not exists signature_miss text;
