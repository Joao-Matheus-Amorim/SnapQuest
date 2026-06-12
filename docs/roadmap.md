# Roadmap do SnapQuest

Ultima atualizacao: 2026-06-12.

Este roadmap registra fases, status e proximas entregas. Ele deve refletir codigo real, nao intencao.

## Fase 0 - Fundacao e governanca

Status: concluido.

Entregas:

- Governanca PMBOK adaptada.
- Documentacao viva.
- Registro de riscos.
- Registro de divida tecnica.
- Checks estaticos.
- CI base.

## Fase 1 - MVP web validado

Status: parcialmente concluido.

Entregas:

- MVP web jogavel.
- Criacao local de Fighters e Cartas.
- Inventario e batalha local.
- Supabase inicial.
- Deploy web preparado.

Pendencias:

- UX web de conta/nuvem nao e experiencia final.
- Sync web precisa de validacao mais forte.
- Fotos novas ja usam Storage privado versionado; falta consolidar smoke operacional mais formal.

## Fase 2 - Bootstrap React Native + Expo

Status: concluido.

Entregas:

- Estrutura Expo.
- Expo Router.
- Telas mobile principais.
- Configuracao SDK 54.
- Preservacao do MVP web.

## Fase 3 - Inventario mobile e persistencia

Status: concluido em MVP.

Entregas:

- Capturas brutas.
- Deck pessoal local.
- Adapter de storage mobile.
- Persistencia de foto final em arquivo permanente.
- Inventario com filtros.
- Catalogo cloud com fallback seed.
- Estado explicito de catalogo cloud/seed/erro para a UI.
- Modo dono para catalogo via galeria.

Validacao operacional:

- `npm run test:rls:catalog` passou no Supabase real em 2026-06-10 com usuario comum e usuario dono.

## Fase 4 - Batalha mobile

Status: concluido em MVP.

Entregas:

- `useBattle` encapsulando o core.
- Setup de dois jogadores.
- Passar celular entre turnos.
- Energia por turno.
- Compra automatica de carta no inicio do turno.
- Uso de cartas por toque/arrasto.
- Ataque direto por toque/arrasto.
- Habilidades passivas: provocar, escudo e veneno.
- UI com HP por carta, mao de cartas, indicador de turno, log recolhivel e vencedor.

Divida:

- TD-010 fechado: `npm audit` zerou com `vite@^6.4.3`, remocao de `@expo/ngrok` e `overrides` de `postcss`/`uuid`.
- TD-008 fechado: workflow duplicado saiu do repo e `ci.yml` virou a unica pipeline de CI.
- TD-005 fechado: `App.tsx` legado saiu do repo e o entry mobile ficou consolidado em `expo-router/entry`.
- TD-004 fechado: conta mobile agora garante perfil, diferencia confirmacao de email, mostra estado de sync e usa permissao real de catalogo.
- Base UX de conta/catalogo reforcada: `AuthProvider` unico no layout e fallback de catalogo visivel para a UI.
- TD-002 fechado: cobertura automatizada do core MVP esta completa para balance, factories, sugestao de cartas e batalha local.
- TD-003 reaberto como escopo futuro: LCK/SPD existem como atributos, mas nao controlam iniciativa/critico nesta versao.

## Fase 5 - Cerimonia de criacao e IA

Status: em andamento.

Entregas atuais:

- Primeiro refinamento gamificado mobile: Home como mesa de batalha, navegacao em estilo HUD, portal de captura, modal de nome e cards.
- Transformacao Fighter/Carta.
- Fallback offline.
- IA Gemini opcional sob demanda.
- Modal de nome.
- Modal de revelacao.

Entregas pendentes:

- Cerimonia visual completa de analise.
- Roleta de atributos/raridade.
- Revisao humana mais rica antes de salvar.
- Validar comportamento real da edge de Gemini no fluxo de dispositivo apos rollout operacional.

## Fase 6 - Nuvem pronta para producao

Status: futuro proximo.

Objetivo:

- Fechar contratos Supabase para uso confiavel.

Entregas:

- Migration para catalogo (`is_catalog`) ou redesign do catalogo.
- Politicas RLS para catalogo compartilhado, se mantido.
- Rerodar `npm run test:rls:catalog` apos qualquer mudanca em catalogo/RLS.
- Sync local/cloud validado.

## Fase 7 - Produto familiar completo

Status: futuro.

Possiveis entregas:

- XP e progressao.
- Conquistas.
- Diario de aventuras.
- Colecoes.
- Eventos semanais.
- Multiplayer online.
- Publicacao mobile.

## Fase futura - Refinos avancados de combate

Status: futuro.

Possiveis entregas:

- Iniciativa ou ordem por SPD.
- Critico, esquiva ou sorte por LCK.
- Balanceamento por raridade e custo apos telemetria/manual playtest.
- Animacoes finais de batalha validadas em Android real.

## Prioridade imediata recomendada

1. Validar batalha em dispositivo real com toque/arrasto.
2. Refinar cerimonia visual.
3. Criar smoke test mobile/web.
4. Validar fluxo local/cloud em dispositivo sem misturar escopos.
