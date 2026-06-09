# Estado Atual do SnapQuest

Ultima atualizacao: 2026-06-09

## Resumo executivo

SnapQuest e um card game mobile-first em validacao, onde fotos viram lutadores e cartas de efeito para batalhas locais entre pai e filho.

O repositorio atual contem um MVP web em HTML/CSS/JavaScript puro com Vite e integracao inicial com Supabase. A direcao atual e preparar uma base React Native + Expo sem quebrar o MVP web existente.

## Estado real hoje

### Implementado

- MVP web jogavel.
- Criacao local de lutadores.
- Criacao local de cartas de efeito.
- Inventario local.
- Batalha local por turnos no mesmo dispositivo.
- Core de jogo separado em `src/js/core/`.
- Schema Supabase em `supabase/schema.sql`.
- Configuracao Vite e Vercel.
- Leitura de env publica via `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Bloqueio de chave `sb_secret_` no frontend.
- Documentos iniciais de governanca, risco e divida tecnica.
- Contrato inicial/mock para sugestao de cartas por foto em `src/js/services/cardSuggestionService.js`.

### Parcial ou em validacao

- Auth Supabase no MVP web.
- Sincronizacao de inventario com Supabase.
- UX de Conta/Nuvem ainda nao e produto final.
- Deploy Vercel pode depender de limite/rate limit externo.
- Sugestao de cartas por IA ainda e contrato/mock; nao chama backend real e nao salva cartas.
- Bootstrap React Native + Expo na branch `feat/rn-bootstrap`.
- Estrutura mobile inicial com Expo Router em `src/app/`.
- Telas mobile esqueleto de Home, Camera, Inventory e Battle.
- Validacao SDK 54 em andamento no Expo Go.

### Nao implementado

- App React Native + Expo mergeado em `main`.
- Camera/foto como fluxo completo de criacao de fighter.
- Supabase Storage para fotos.
- IA real para lore/atributos por foto.
- Inventario mobile completo.
- Batalha mobile completa.
- Auth nativo consolidado.
- Testes automatizados robustos.

## Branches e PRs relevantes

- `main`: fonte atual do projeto.
- PR #5: Vite/env Supabase foi mergeado.
- PR #9: fechado sem merge, pois a direcao mudou para migracao mobile em vez de continuar refatorando UI web.
- Issue #10 / PR #11: cria a skill de documentacao e ciencia do projeto.
- Issue #12: bootstrap React Native + Expo sem quebrar MVP web.
- Issue #17 / PR #18: contrato inicial de sugestao de cartas por foto foi mergeado.
- Branch `feat/rn-bootstrap`: bootstrap mobile em andamento.

## Decisao atual

O bootstrap React Native + Expo deve continuar em PR pequeno, preservando o MVP web e mantendo `src/js/core/` intocado.

Gemini/IA deve continuar como assistente criativo com contrato estruturado, revisao humana e validacao pelo core antes de qualquer carta real ser salva.

Antes de mergear o bootstrap mobile, a validacao manual no Expo Go deve ser confirmada ou marcada explicitamente como pendente no PR.
