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
- Conversao de foto bruta em Fighter ou Carta via Gemini real (fallback para mock sem chave).
- Persistencia local do deck do jogador via SecureStore + AsyncStorage (`usePlayerDeck`, `mobileStorage.ts`).
- Batalha mobile completa: setup, turno por turno, passar celular, vencedor.
- `useBattle` encapsulando todo o core de batalha (`battle.js`).
- Tipos TypeScript completos para o core (`battle.d.ts`, `fighters.d.ts`, `cards.d.ts`).
- GitHub Actions CI.

### Parcial ou em validacao

- Auth Supabase no MVP web.
- Sincronizacao de inventario com Supabase.
- UX de Conta/Nuvem ainda nao e produto final.
- Gemini real integrado com fallback para mock; lore/atributos ainda nao sao gerados com base no conteudo real da foto.

### Nao implementado

- Tela de transformacao com cerimonia (animacao, roleta de dados ao vivo).
- LCK e SPD sem efeito real na batalha.
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

Gemini real esta integrado com fallback para mock. O proximo passo e a cerimonia visual de transformacao antes de refinar o prompt Gemini para lore/atributos baseados no conteudo da foto.
