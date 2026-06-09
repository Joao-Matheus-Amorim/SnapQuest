# Roadmap do SnapQuest

Este roadmap registra para onde o projeto vai. Ele deve refletir o estado real e ser atualizado quando uma fase mudar.

## Fase 0 — Fundacao e governanca

Status: concluido

Objetivo:
- Manter MVP web rastreavel.
- Consolidar documentacao viva.
- Evitar gaps, falso verde e divida tecnica invisivel.

Entregas:
- Governanca PMBOK adaptada.
- Registro de riscos.
- Registro de divida tecnica.
- Skill de documentacao do projeto.

## Fase 1 — MVP web validado

Status: parcialmente concluido

Objetivo:
- Validar se o loop foto -> carta/lutador -> inventario -> batalha e divertido.

Entregas existentes:
- Criacao local de lutadores.
- Criacao local de cartas.
- Inventario local.
- Batalha local.
- Supabase inicial.

Pendencias:
- UX de conta ainda nao e final.
- Sincronizacao precisa de testes e melhorias.
- Fotos ainda nao usam Storage.

## Fase 2 — Bootstrap React Native + Expo

Status: concluido

Objetivo:
- Criar base mobile sem quebrar o MVP web.
- Reutilizar `src/js/core/`.
- Preparar camera real e navegacao nativa.

Entregas realizadas:
- Estrutura Expo.
- Navegacao mobile com Expo Router.
- Tela inicial mobile.
- Tela camera esqueleto validada no Expo Go.
- Telas Inventory e Battle esqueleto.
- Documentacao `docs/rn-migration.md`.

## Fase 3 — Inventario mobile e persistencia

Status: em andamento

Objetivo:
- Criar inventario mobile real.
- Adaptar persistencia local para React Native.
- Integrar Supabase de forma segura.

Entregas realizadas:
- `useInventory` usando seed do core web.
- Home mobile com contadores reais.
- Inventory mobile renderizando fighters/cartas seeded.
- Battle mobile alinhada ao requisito do core: 6 fighters + 6 cartas.

Entregas em andamento:
- Persistencia local de fotos brutas capturadas.
- Secao separada de fotos brutas no inventario mobile.

Entregas futuras:
- Persistencia local real de fighters/cartas criados pelo usuario.
- Sync com Supabase.

## Fase 4 — Batalha mobile

Status: planejado

Objetivo:
- Reutilizar o core de batalha em interface React Native.

Entregas esperadas:
- `useBattle` wrapping `src/js/core/battle.js`.
- Tela de batalha mobile.
- Passar celular entre dois jogadores.
- Log de batalha nativo.

## Fase 5 — Foto real, Storage e IA

Status: planejado

Objetivo:
- Foto real vira lutador/carta com lore e atributos.

Entregas existentes:
- Contrato inicial de sugestao de carta por foto em `src/js/services/cardSuggestionService.js`.
- Documentacao em `docs/gemini-card-suggestions.md`.

Entregas esperadas:
- Conversao de foto bruta em Fighter/carta.
- Upload para Supabase Storage.
- IA para lore/atributos.
- Revisao humana antes de salvar.

## Fase 6 — Produto familiar completo

Status: futuro

Objetivo:
- Transformar o MVP em produto familiar recorrente.

Possiveis entregas:
- XP.
- Conquistas.
- Diario de aventuras.
- Colecoes.
- Eventos semanais.
- Multiplayer futuro.
