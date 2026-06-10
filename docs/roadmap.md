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

Pendencia operacional:

- Validar RLS de catalogo em ambiente real com usuario comum e usuario dono.

## Fase 4 - Batalha mobile

Status: concluido em MVP.

Entregas:

- `useBattle` encapsulando o core.
- Setup de dois jogadores.
- Passar celular entre turnos.
- Compra, carta, ataque e vencedor.
- UI com HP, selecao e log.

Divida:

- LCK e SPD ainda nao tem efeito completo.
- Faltam testes automatizados de regra.

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
- Testes de RLS ou fixtures de banco.
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

1. Validar RLS de catalogo no Supabase real.
2. Criar testes de core de batalha.
3. Criar Storage para fotos.
4. Mover Gemini para backend/edge.
5. Refinar cerimonia visual.
