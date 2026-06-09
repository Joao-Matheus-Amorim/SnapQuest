# Estado Atual do SnapQuest

Ultima atualizacao: 2026-06-09

## Resumo executivo

SnapQuest e um card game mobile-first em validacao, onde fotos viram lutadores e cartas de efeito para batalhas locais entre pai e filho.

O repositorio atual contem um MVP web em HTML/CSS/JavaScript puro com Vite, integracao inicial com Supabase e base React Native + Expo em evolucao.

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
- Bootstrap React Native + Expo mergeado em `main` pelo PR #19.
- Inventario mobile local seeded mergeado em `main` pelo PR #21.

### Parcial ou em validacao

- Auth Supabase no MVP web.
- Sincronizacao de inventario com Supabase.
- UX de Conta/Nuvem ainda nao e produto final.
- Deploy Vercel pode depender de limite/rate limit externo.
- Sugestao de cartas por IA ainda e contrato/mock; nao chama backend real e nao salva cartas.
- Fotos brutas capturadas localmente em andamento na branch `issue16-captured-photos`.
- Camera mobile salva foto bruta em validacao.
- Inventory mobile exibe fotos brutas separadas em validacao.
- Battle mobile ainda nao e jogavel; apenas usa requisito do core para indicar disponibilidade.

### Nao implementado

- Persistencia local mobile real para fighters/cartas criados pelo usuario.
- Camera/foto como fluxo completo de criacao de fighter.
- Conversao de foto bruta em Fighter/carta.
- Supabase Storage para fotos.
- IA real para lore/atributos por foto.
- Batalha mobile completa usando `src/js/core/battle.js`.
- Auth nativo consolidado.
- Testes automatizados robustos.

## Branches e PRs relevantes

- `main`: fonte atual do projeto.
- PR #5: Vite/env Supabase foi mergeado.
- PR #9: fechado sem merge, pois a direcao mudou para migracao mobile em vez de continuar refatorando UI web.
- Issue #10 / PR #11: cria a skill de documentacao e ciencia do projeto.
- Issue #12 / PR #19: bootstrap React Native + Expo foi mergeado.
- Issue #17 / PR #18: contrato inicial de sugestao de cartas por foto foi mergeado.
- Issue #20 / PR #21: inventario mobile local com seed do core web foi mergeado.
- Issue #16: persistencia local de fotos brutas capturadas em andamento.
- Branch `issue16-captured-photos`: persistencia local de fotos brutas em andamento.

## Decisao atual

O proximo passo e concluir a persistencia local de fotos brutas capturadas pela camera, sem converter em Fighter/carta, sem DB, sem Storage remoto, sem Gemini real e sem liberar batalha por foto bruta.

Gemini/IA deve continuar como assistente criativo com contrato estruturado, revisao humana e validacao pelo core antes de qualquer carta real ser salva.

A regra de batalha deve seguir o core web: 6 fighters + 6 cartas totais para simular dois jogadores.
