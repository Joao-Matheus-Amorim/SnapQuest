# Banco de Dados - SnapQuest

Ultima atualizacao: 2026-06-10.

## Fonte versionada

O schema versionado fica em:

```txt
supabase/schema.sql
```

Ele deve ser aplicado no SQL Editor do Supabase ou por migration equivalente.

## Tabelas versionadas

| Tabela | Finalidade |
|---|---|
| `snapquest_profiles` | Perfil do usuario e progresso inicial. |
| `snapquest_fighters` | Fighters do inventario. |
| `snapquest_effect_cards` | Cartas de efeito do inventario. |
| `snapquest_battle_logs` | Registro futuro de batalhas. |

## Seguranca

Todas as tabelas versionadas habilitam RLS.

Politica central para dados de usuario:

```sql
auth.uid() = user_id
```

Em `snapquest_profiles`, a regra usa:

```sql
auth.uid() = id
```

## Contrato usado pelo app atual

O app mobile atual usa:

- `snapquest_fighters`
- `snapquest_effect_cards`
- `is_catalog`
- `user_id`
- `photo_data_url` (legado, somente fallback de leitura)
- `photo_storage_path` (fonte oficial para novas fotos)
- campos de atributos, classe/categoria e raridade
- `can_manage_catalog` em `snapquest_profiles` para permitir escrita administrativa no catalogo

Arquivos principais:

- `src/services/cloudSync.ts`
- `src/hooks/useCatalog.ts`
- `src/hooks/useInventory.ts`
- `src/app/inventory.tsx`

## Catalogo compartilhado

`src/services/cloudSync.ts` consulta e grava `.eq("is_catalog", true|false)`.

O schema versionado declara:

```sql
is_catalog boolean not null default false
can_manage_catalog boolean not null default false
```

Modelo de acesso:

- usuarios anonimos e autenticados podem ler itens de catalogo;
- usuarios autenticados podem ler/escrever seus proprios itens pessoais;
- somente perfis com `can_manage_catalog = true` podem inserir, atualizar ou excluir itens de catalogo;
- `can_manage_catalog` nao pode ser atualizado pelo frontend autenticado.

## Aplicacao em ambiente real

Status: aplicado manualmente no Supabase em 2026-06-10, conforme confirmacao operacional.

Para novos ambientes, depois de aplicar `supabase/schema.sql`, habilite o dono do catalogo com SQL administrativo:

```sql
update public.snapquest_profiles
set can_manage_catalog = true
where id = '<user_id_do_dono>';
```

Use somente o SQL Editor/Service Role para esse ajuste. Nao exponha Service Role no app.

## Validacao operacional

O contrato esta versionado, aplicado e validado contra o Supabase real em 2026-06-10. A validacao funcional fica automatizada em:

```bash
npm run test:rls:catalog
```

Roteiro e evidencia: `docs/catalog-rls-validation.md`.

Resultado registrado:

- usuario comum cria/remove item pessoal;
- usuario comum nao escreve catalogo;
- usuario comum nao se autopromove com `can_manage_catalog`;
- usuario dono escreve/remove catalogo;
- usuario comum le catalogo;
- usuario anonimo le catalogo;
- usuario comum nao atualiza/remove catalogo.

## Fotos

Estado atual:

- Mobile comprime e persiste foto localmente em `src/lib/photoStorage.ts`.
- Mobile e web sobem fotos novas para o bucket privado `snapquest-photos`.
- O banco passa a persistir `photo_storage_path`; `photo_data_url` fica apenas para compatibilidade de leitura em registros antigos.

Destino recomendado:

```txt
snapquest-photos/
  users/{user_id}/fighters/{fighter_id}.jpg
  users/{user_id}/cards/{card_id}.jpg
  catalog/fighters/{fighter_id}.jpg
  catalog/cards/{card_id}.jpg
```

Leitura e feita via signed URL curta. O banco guarda apenas o path do objeto, nao a imagem inteira.

## Checklist de mudanca de banco

- Atualizar `supabase/schema.sql`.
- Atualizar este documento.
- Atualizar `risk-register.md`.
- Atualizar `technical-debt-register.md`.
- Rodar `npm run check`.
- Rodar `npm run test:rls:catalog` com pelo menos dois usuarios apos qualquer mudanca em catalogo/RLS.
