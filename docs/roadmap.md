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
- Camera real com expo-image-picker.
- Telas Inventory e Battle.
- Documentacao `docs/rn-migration.md`.

## Fase 3 — Inventario mobile e persistencia

Status: concluido

Objetivo:
- Criar inventario mobile real.
- Adaptar persistencia local para React Native.

Entregas realizadas:
- `useInventory` com seed do core web.
- Home mobile com contadores reais.
- Inventory mobile renderizando fighters/cartas (seed + deck do jogador).
- Camera captura foto bruta e persiste localmente (`useCapturedPhotos`).
- Conversao de foto bruta em Fighter/carta via mock Gemini.
- Deck do jogador persistido via SecureStore (`usePlayerDeck`).
- Adapter de storage mobile (`mobileStorage.ts`).

Pendente (proxima fase):
- Sync com Supabase.

## Fase 4 — Batalha mobile

Status: concluido

Objetivo:
- Reutilizar o core de batalha em interface React Native.

Entregas realizadas:
- `useBattle` encapsulando `src/js/core/battle.js`.
- Tela de batalha mobile completa.
- Passar celular entre dois jogadores.
- Log de batalha nativo.
- Tela de vencedor.
- Tipos TypeScript completos para o core de batalha.

Divida tecnica:
- LCK e SPD nao tem efeito real no combate ainda.

## Fase 5 — Cerimonia de criacao e IA

Status: em andamento

Objetivo:
- Foto real vira lutador/carta com experiencia visual completa.
- Roleta de dados ao vivo para atributos e raridade.

Entregas em andamento:
- Tela de transformacao com cerimonia: analise da foto, revelacao de classe/categoria, roleta de dados para cada atributo.

Entregas futuras:
- IA real (Gemini) para lore e atributos baseados na foto.
- Upload para Supabase Storage.
- Revisao humana antes de salvar.
- LCK e SPD com efeito real no combate.

## Fase 6 — Produto familiar completo

Status: futuro

Objetivo:
- Transformar o MVP em produto familiar recorrente.

Possiveis entregas:
- XP e progressao.
- Conquistas.
- Diario de aventuras.
- Colecoes.
- Eventos semanais.
- Multiplayer futuro.
