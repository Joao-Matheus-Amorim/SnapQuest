# Estado Atual do SnapQuest

Ultima atualizacao: 2026-06-09

## Resumo executivo

SnapQuest e um card game mobile-first em validacao, onde fotos viram lutadores e cartas de efeito para batalhas locais entre pai e filho.

O repositorio atual contem um MVP web em HTML/CSS/JavaScript puro com Vite e integracao inicial com Supabase. A proxima grande direcao e preparar uma base React Native + Expo sem quebrar o MVP web existente.

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

### Nao implementado

- App React Native + Expo mergeado em `main`.
- Camera real no app nativo mergeada em `main`.
- Supabase Storage para fotos.
- IA real para lore/atributos por foto.
- Inventario mobile completo.
- Batalha mobile completa.
- Auth nativo consolidado.
- Testes automatizados robustos.

## Branches e PRs relevantes

- `main`: fonte atual do projeto.
- `feat/gemini-card-suggestion-contract`: contrato inicial de sugestao de cartas por foto.
- PR #5: Vite/env Supabase foi mergeado.
- PR #9: fechado sem merge, pois a direcao mudou para migracao mobile em vez de continuar refatorando UI web.
- Issue #10: cria a skill de documentacao e ciencia do projeto.
- Issue #17: projetar Gemini para auxiliar criacao de cartas sem substituir o core.

## Decisao atual

Antes de integrar IA real, o projeto deve ter contrato estruturado, revisao humana e validacao pelo core.

A migracao mobile deve preservar o MVP web ate que exista app nativo equivalente ou melhor.
