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
- `photo_data_url`
- campos de atributos, classe/categoria e raridade

Arquivos principais:

- `src/services/cloudSync.ts`
- `src/hooks/useCatalog.ts`
- `src/hooks/useInventory.ts`
- `src/app/inventory.tsx`

## Gap critico conhecido

`src/services/cloudSync.ts` consulta e grava `.eq("is_catalog", true|false)`, mas `supabase/schema.sql` ainda nao declara a coluna `is_catalog`.

Impacto:

- Em um banco novo criado apenas com `schema.sql`, chamadas de catalogo podem falhar.
- RLS atual protege itens por `user_id`, mas nao define uma politica clara para catalogo compartilhado.

Acao necessaria:

1. Definir se catalogo sera publico para usuarios autenticados ou restrito por dono.
2. Adicionar coluna `is_catalog boolean not null default false`.
3. Criar policies compativeis:
   - leitura de itens pessoais pelo dono;
   - leitura de catalogo pelos usuarios permitidos;
   - escrita de catalogo apenas pelo dono/admin.
4. Atualizar `schema.sql`, docs e checks.

## Fotos

Estado atual:

- Mobile comprime e persiste foto localmente em `src/lib/photoStorage.ts`.
- Banco ainda aceita `photo_data_url`.

Destino recomendado:

```txt
snapquest-photos/
  users/{user_id}/fighters/{fighter_id}.jpg
  users/{user_id}/cards/{card_id}.jpg
  catalog/fighters/{fighter_id}.jpg
  catalog/cards/{card_id}.jpg
```

O banco deve passar a guardar URL/path de Storage, nao a imagem inteira.

## Checklist de mudanca de banco

- Atualizar `supabase/schema.sql`.
- Atualizar este documento.
- Atualizar `risk-register.md`.
- Atualizar `technical-debt-register.md`.
- Rodar `npm run check`.
- Validar RLS com pelo menos dois usuarios antes de producao.
