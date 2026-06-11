# Validacao RLS do Catalogo

Data de referencia: 2026-06-10.

Este documento fecha o criterio operacional do TD-011/GAP-006: provar que o catalogo compartilhado respeita RLS com um usuario comum e um usuario dono.

## Fonte oficial

O contrato segue o modelo recomendado pelo Supabase: tabelas expostas em `public` devem ter RLS habilitado, e as policies devem usar o contexto autenticado via `auth.uid()`.

Referencias:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control

## Escopo validado

Tabelas:

- `public.snapquest_profiles`
- `public.snapquest_fighters`
- `public.snapquest_effect_cards`

Comportamentos:

- usuario comum cria e remove item pessoal;
- usuario comum nao cria item de catalogo;
- usuario comum nao consegue se promover com `can_manage_catalog=true`;
- usuario dono com `can_manage_catalog=true` cria item de catalogo;
- usuario comum le item de catalogo;
- usuario anonimo le item de catalogo;
- usuario comum nao atualiza nem remove item de catalogo;
- usuario dono remove os itens de catalogo criados pelo teste.

## Pre-requisitos

1. Aplicar `supabase/schema.sql` no Supabase.
2. Ter dois usuarios reais no Supabase Auth:
   - usuario comum;
   - usuario dono.
3. Promover o usuario dono pelo SQL Editor.

SQL administrativo para promover o dono:

```sql
insert into public.snapquest_profiles (id, display_name, can_manage_catalog)
select id, 'Catalog Owner', true
from auth.users
where email = '<email_do_usuario_dono>'
on conflict (id) do update
set can_manage_catalog = true;
```

O usuario comum nao deve ter `can_manage_catalog=true`.

## Guard obrigatorio contra autopromocao

O schema versionado inclui um trigger que bloqueia alteracao de `can_manage_catalog` por usuarios `anon` e `authenticated`.

Se o ambiente ja estava criado antes desta protecao, aplique este SQL administrativo uma vez:

```sql
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
```

Se uma execucao anterior do teste promoveu o usuario comum, reverta com SQL administrativo:

```sql
update public.snapquest_profiles
set can_manage_catalog = false
where id = (
  select id
  from auth.users
  where email = '<email_do_usuario_comum>'
);
```

## Variaveis locais

Defina somente no `.env` local:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
RLS_TEST_COMMON_EMAIL=
RLS_TEST_COMMON_PASSWORD=
RLS_TEST_OWNER_EMAIL=
RLS_TEST_OWNER_PASSWORD=
```

Tambem sao aceitos `SUPABASE_URL` e `SUPABASE_ANON_KEY`.

Nunca use `service_role` neste teste. O objetivo e validar a RLS pelo mesmo caminho publico/autenticado usado pelo app.

## Comando

```bash
npm run test:rls:catalog
```

## Resultado esperado

O comando deve terminar com:

```txt
SnapQuest catalog RLS validation passed.
```

E deve listar os cenarios permitidos/bloqueados, incluindo:

- `common can insert personal fighter`
- `common can insert personal card`
- `common cannot insert catalog fighter: denied`
- `common cannot insert catalog card: denied`
- `common cannot self-promote can_manage_catalog: denied`
- `common self-promotion left can_manage_catalog=false`
- `owner can insert catalog fighter`
- `owner can insert catalog card`
- `common can read catalog fighter`
- `common can read catalog card`
- `anon can read catalog fighter`
- `anon can read catalog card`
- `common cannot update catalog fighter: denied`
- `common cannot delete catalog fighter: denied`
- `owner can delete catalog card cleanup`
- `owner can delete catalog fighter cleanup`
- `common can delete personal fighter cleanup`
- `common can delete personal card cleanup`

## Falhas e interpretacao

| Falha | Interpretacao | Acao |
|---|---|---|
| Login falha | Usuario de teste nao existe ou senha esta errada. | Corrigir `.env` local ou criar usuario no Supabase Auth. |
| Owner sem permissao | `can_manage_catalog` nao esta `true` para o dono. | Rodar o SQL administrativo acima. |
| Common cria catalogo | RLS de insert esta aberta demais. | Revisar policies `fighters_insert_own` e `cards_insert_own`. |
| Common se promove | Revogacao de coluna, trigger guard ou policy de perfil falhou. | Revisar `revoke update (can_manage_catalog)` e `snapquest_guard_catalog_admin_flag`. |
| Common nao le catalogo | Policy de select do catalogo esta restritiva demais. | Revisar `fighters_select_own` e `cards_select_own`. |
| Cleanup falha | Pode sobrar item `rls_*`. | Remover manualmente pelo SQL Editor. |

## Evidencia local

Ultima execucao conhecida neste repo:

```txt
2026-06-10 - Supabase real, anon key, usuario comum e usuario dono.
Resultado: SnapQuest catalog RLS validation passed.

- common can insert personal fighter
- common can insert personal card
- common cannot insert catalog fighter: denied
- common cannot insert catalog card: denied
- common cannot self-promote can_manage_catalog: denied
- common self-promotion left can_manage_catalog=false
- owner can insert catalog fighter
- owner can insert catalog card
- common can read catalog fighter
- common can read catalog card
- common cannot update catalog fighter: denied
- common cannot delete catalog fighter: denied
- owner can delete catalog card cleanup
- owner can delete catalog fighter cleanup
- common can delete personal fighter cleanup
- common can delete personal card cleanup
```
