# Banco de Dados — SnapQuest MVP

O MVP usa Supabase apenas para inventário recorrente.

## Tabelas

- `snapquest_profiles`
- `snapquest_fighters`
- `snapquest_effect_cards`
- `snapquest_battle_logs`

## Segurança

Todas as tabelas têm RLS ativado.

Política central:

```sql
auth.uid() = user_id
```

No caso de `snapquest_profiles`, o ID do perfil é o próprio `auth.users.id`.

## Fotos

No MVP, as fotos podem ser salvas como `photo_data_url`.

Isso é aceitável para protótipo, mas não para produção.

## Próximo passo

Migrar fotos para Supabase Storage:

```txt
snapquest-photos/
  users/{user_id}/fighters/{fighter_id}.jpg
  users/{user_id}/cards/{card_id}.jpg
```

O banco passará a guardar apenas `photo_url`.
