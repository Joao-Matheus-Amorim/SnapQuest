# Estado Atual do SnapQuest

Ultima atualizacao: 2026-06-10

## Resumo executivo

SnapQuest e um card game mobile-first em validacao, onde fotos viram lutadores e cartas de efeito para batalhas locais entre pai e filho.

O repositorio contem um MVP web em HTML/CSS/JavaScript puro com Vite, integracao inicial com Supabase, e base React Native + Expo com inventario e batalha mobile funcionando.

## Estado real hoje

### Implementado

- MVP web jogavel.
- Criacao local de lutadores e cartas.
- Inventario local.
- Batalha local por turnos no mesmo dispositivo (web).
- Core de jogo separado em `src/js/core/` (reutilizado no mobile).
- Schema Supabase em `supabase/schema.sql`.
- Configuracao Vite e Vercel.
- Bloqueio de chave `sb_secret_` no frontend.
- Bootstrap React Native + Expo.
- Camera mobile captura foto e salva como captura bruta (`useCapturedPhotos`).
- Inventario mobile renderiza fighters/cartas (seed + deck do jogador).
- Conversao de foto bruta em Fighter ou Carta via mock Gemini.
- Persistencia local do deck do jogador via SecureStore (`usePlayerDeck`).
- Batalha mobile completa: setup, turno por turno, passar celular, vencedor.
- `useBattle` encapsulando todo o core de batalha (`battle.js`).
- Tipos TypeScript completos para o core (`battle.d.ts`, `fighters.d.ts`, `cards.d.ts`).
- GitHub Actions CI.

### Parcial ou em validacao

- Auth Supabase no MVP web.
- Sincronizacao de inventario com Supabase.
- UX de Conta/Nuvem ainda nao e produto final.
- Mock Gemini nao chama backend real.

### Nao implementado

- Tela de transformacao com cerimonia (animacao, roleta de dados ao vivo).
- LCK e SPD sem efeito real na batalha.
- IA real (Gemini) para lore/atributos por foto.
- Supabase Storage para fotos.
- Auth nativo consolidado.
- Testes automatizados robustos.

## Branches e PRs relevantes

- `main`: fonte atual do projeto.
- PR #5: Vite/env Supabase mergeado.
- PR #11: documentacao e governanca.
- PR #19: bootstrap React Native + Expo mergeado.
- PR #18: contrato inicial de sugestao de cartas por foto mergeado.
- Issue #20 / branch `issue20-mobile-inventory`: inventario + batalha mobile — mergeado diretamente em main em 2026-06-10.

## Decisao atual

O proximo passo e construir a tela de transformacao com cerimonia visual:
foto -> animacao de analise -> revelacao da classe/categoria -> roleta de dados ao vivo para cada atributo -> card finalizado.

Gemini/IA continua como mock por enquanto. O foco e a experiencia visual da criacao antes de ligar a IA real.
