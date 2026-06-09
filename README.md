# SnapQuest

SnapQuest é um card game mobile-first que mistura fotografia real, RPG leve e batalha local pai & filho.

Este repositório começa com um MVP web para validar a jogabilidade antes de migrar para React Native + Expo.

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

Instale dependências:

```bash
npm install
```

Crie um `.env` local, se quiser testar Supabase sem preencher manualmente na tela:

```bash
cp .env.example .env
```

Use apenas chave pública/anon:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Rode o app:

```bash
npm run dev
```

Depois acesse:

```txt
http://localhost:5173
```

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Rode `supabase/schema.sql` no SQL Editor.
3. Use `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na Vercel ou no `.env` local.
4. Crie conta ou faça login no app.
5. Sincronize o inventário.

Nunca coloque `service_role` no frontend.

## Deploy na Vercel

Configure as variáveis:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Configuração esperada:

```txt
Build Command: npm run build
Output Directory: dist
```

O `vercel.json` já define esse comportamento.

## Próxima migração

Quando a mecânica estiver validada, migrar para:

- React Native + Expo
- Supabase Storage para fotos
- Auth nativo
- Câmera real obrigatória
- Diário de batalhas
- Conquistas
- Gemini para lore
