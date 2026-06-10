# Roadmap do SnapQuest

Ultima atualizacao: 2026-06-10.

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
- Fotos web/prototipo ainda nao usam Storage.

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
- Modo dono para catalogo via galeria.

Validacao operacional:

- `npm run test:rls:catalog` passou no Supabase real em 2026-06-10 com usuario comum e usuario dono.

## Fase 4 - Batalha mobile

Status: concluido em MVP.

Entregas:

- `useBattle` encapsulando o core.
- Setup de dois jogadores.
- Passar celular entre turnos.
- Compra, carta, ataque e vencedor.
- UI com HP, selecao e log.
- LCK com faixa de critico e SPD com iniciativa/modificador de ataque.

Divida:

- TD-002 fechado: cobertura automatizada do core MVP esta completa para balance, factories, sugestao de cartas e batalha local.
- TD-003 fechado: regras de LCK/SPD estao documentadas em `battle-rules.md`, implementadas no core e expostas na UI.

## Fase 5 - Cerimonia de criacao e IA

Status: em andamento.

Entregas atuais:

- Transformacao Fighter/Carta.
- Fallback offline.
- IA Gemini opcional sob demanda.
- Modal de nome.
- Modal de revelacao.

Entregas pendentes:

- Cerimonia visual completa de analise.
- Roleta de atributos/raridade.
- Revisao humana mais rica antes de salvar.
- Backend/edge para proteger Gemini.

## Fase 6 - Nuvem pronta para producao

Status: futuro proximo.

Objetivo:

- Fechar contratos Supabase para uso confiavel.

Entregas:

- Migration para catalogo (`is_catalog`) ou redesign do catalogo.
- Politicas RLS para catalogo compartilhado, se mantido.
- Supabase Storage para fotos.
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

## Prioridade imediata recomendada

1. Criar Storage para fotos.
2. Mover Gemini para backend/edge.
3. Refinar cerimonia visual.
