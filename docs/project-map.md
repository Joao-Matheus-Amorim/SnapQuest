# Mapa do Projeto SnapQuest

Este documento mostra onde cada parte do SnapQuest vive e qual responsabilidade cada area possui.

## Raiz

- `index.html`: entrada do MVP web. Web only.
- `vite.config.js`: build Vite do MVP web. Web only.
- `vercel.json`: deploy do MVP web na Vercel. Web only.
- `package.json`: scripts e dependencias atuais do MVP web.
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

## Services

Local: `src/js/services/`

Responsabilidade: integracoes e persistencia.

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

## Mobile futuro

Local planejado: a definir no PR de bootstrap Expo.

Opcoes seguras:

- preservar MVP web e criar estrutura mobile isolada; ou
- migrar package/scripts com garantia de que o web continua executavel.

Regra: bootstrap mobile deve ser PR proprio e nao deve alterar `src/js/core/`.
