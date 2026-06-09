# Mapa do Projeto SnapQuest

Este documento mostra onde cada parte do SnapQuest vive e qual responsabilidade cada area possui.

## Raiz

- `index.html`: entrada do MVP web. Web only.
- `vite.config.js`: build Vite do MVP web. Web only.
- `vercel.json`: deploy do MVP web na Vercel. Web only.
- `package.json`: scripts e dependencias do MVP web e comandos iniciais mobile.
- `app.json`: configuracao Expo do app mobile.
- `App.tsx`: arquivo legado do bootstrap inicial; o entry atual usa Expo Router via `expo-router/entry`.
- `.env.example`: exemplo de env publica segura.

## Core de jogo

Local: `src/js/core/`

Responsabilidade: regras puras de jogo, sem DOM, sem Supabase, sem Vercel.

Arquivos:

- `balance.js`: classes, categorias, atributos e balanceamento.
- `fighters.js`: criacao e estrutura de lutadores.
- `cards.js`: criacao e estrutura de cartas.
- `battle.js`: fluxo de batalha.
- `utils.js`: utilitarios puros.

Regra: o core deve ser reutilizavel no mobile. Evitar dependencias web.

## Services web

Local: `src/js/services/`

Responsabilidade: integracoes e persistencia do MVP web.

Arquivos:

- `publicConfig.js`: le env publica do Vite.
- `localStore.js`: persistencia local web via `localStorage`.
- `supabaseClient.js`: cliente Supabase web.
- `inventoryRepository.js`: sincronizacao de inventario.

Regra: services web podem ser adaptados depois para Expo, mas sem contaminar `src/js/core/`.

## UI web

Local: `src/js/ui/`, `src/js/app.js`, `src/styles/app.css`

Responsabilidade: telas, DOM, navegacao e estilo do MVP web.

Status: valido para MVP web, mas nao e arquitetura final do app mobile.

## UI mobile inicial

Local: `src/app/`

Responsabilidade: telas iniciais React Native + Expo Router.

Arquivos:

- `_layout.tsx`: Stack do Expo Router.
- `index.tsx`: Home mobile esqueleto.
- `camera.tsx`: tela de camera esqueleto.
- `inventory.tsx`: tela de inventario esqueleto.
- `battle.tsx`: tela de batalha esqueleto.

Regra: nesta fase, estas telas sao esqueleto. Nao representam gameplay real nem integracao final com foto, Supabase, Gemini ou Storage.

## Componentes mobile iniciais

Local: `src/components/`

Responsabilidade: componentes visuais reutilizaveis do bootstrap mobile.

Arquivos:

- `BattleLog.tsx`
- `CardItem.tsx`
- `FighterCard.tsx`

## Hooks mobile iniciais

Local: `src/hooks/`

Responsabilidade: hooks esqueleto para evolucao posterior do mobile.

Arquivos:

- `useBattle.ts`
- `useInventory.ts`

## Supabase

Local: `supabase/schema.sql`

Responsabilidade: schema inicial, RLS e tabelas do SnapQuest.

Regra: alteracoes de banco devem ser feitas em PR proprio, com documentacao de risco.

## Documentacao

Local: `docs/`

Responsabilidade: memoria tecnica, roadmap, risco, divida e governanca.

Documentos centrais:

- `PROJECT-SKILL.md`
- `current-state.md`
- `project-map.md`
- `roadmap.md`
- `decision-log.md`
- `documentation-policy.md`
- `risk-register.md`
- `technical-debt-register.md`
- `rn-migration.md`

## Regra do bootstrap mobile

O bootstrap mobile deve preservar o MVP web, manter `index.html`, `vite.config.js` e `vercel.json`, e nao alterar `src/js/core/` no mesmo PR.
