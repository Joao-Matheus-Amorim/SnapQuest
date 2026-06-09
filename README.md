# SnapQuest

SnapQuest é um card game mobile-first que mistura fotografia real, RPG leve e batalha local pai & filho.

Este repositório começa com um MVP web estático para validar a jogabilidade antes de migrar para React Native + Expo.

## Objetivo da fundação

- Validar o fluxo: foto -> fighter/carta -> inventário -> batalha.
- Separar regra de jogo da interface.
- Preparar inventário recorrente com Supabase.
- Manter fallback local para continuar jogável sem backend.
- Evitar HTML gigante preso a uma única implementação.

## Estrutura

```txt
src/js/core/       Regras puras do jogo
src/js/services/   Supabase, storage local e inventário
src/js/ui/         Renderização e ações de tela
src/styles/        CSS do app
supabase/          SQL do banco
docs/              Documentação de escopo, banco e roadmap
```

## Rodar localmente

Como o app usa módulos ES, abra com um servidor local:

```bash
python -m http.server 5173
```

Depois acesse:

```txt
http://localhost:5173
```

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Rode `supabase/schema.sql` no SQL Editor.
3. Abra o app.
4. Informe `Project URL` e `anon public key`.
5. Crie conta ou faça login.
6. Sincronize o inventário.

Nunca coloque `service_role` no frontend.

## Próxima migração

Quando a mecânica estiver validada, migrar para:

- React Native + Expo
- Supabase Storage para fotos
- Auth nativo
- Câmera real obrigatória
- Diário de batalhas
- Conquistas
- Gemini para lore
