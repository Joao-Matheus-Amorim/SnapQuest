# Estado Atual do SnapQuest

Ultima atualizacao: 2026-06-10.

## Resumo executivo

SnapQuest e um card game mobile-first em validacao. O produto transforma fotos reais em Fighters ou Cartas e usa esses itens em batalhas locais por turnos.

O repositorio possui:

- MVP web preservado com Vite.
- App mobile Expo em MVP funcional.
- Core de jogo reutilizavel em `src/js/core/`.
- Supabase Auth/DB integrado em nivel inicial.
- Gemini via backend/edge function com fallback offline.
- Documentacao PMBOK adaptada.

## Implementado

### Web

- MVP web jogavel em `index.html`.
- UI web em `src/js/ui/` e `src/styles/app.css`.
- Services web para config publica, storage local, Supabase e repositorio de inventario.
- Vite e Vercel configurados.

### Core de jogo

- Classes, categorias, atributos e balanceamento.
- Criacao de Fighters e Cartas.
- Batalha local por turnos.
- Vantagem/desvantagem de classe.
- LCK com faixa de critico.
- SPD com iniciativa e modificador de ataque capado.
- Stats efetivos de batalha com buffs/debuffs.
- Compra, uso de carta, ataque, fim de turno e vencedor.
- Tipos `.d.ts` para consumo TypeScript.

### Mobile

- Expo Router em `src/app/`.
- Home com contadores reais.
- Home refinada como painel mobile com status, metricas, acoes principais e conta.
- Login/cadastro Supabase com mensagens de sessao e confirmacao.
- `AuthProvider` unico no layout para hidratar sessao/perfil sem duplicar listeners por tela.
- Logout limpando deck local.
- Perfil `snapquest_profiles` garantido no primeiro login.
- Captura por camera.
- Galeria no modo admin de catalogo.
- Resolucao de URI local em iOS/native.
- Fila de capturas brutas.
- Persistencia local de capturas.
- Persistencia permanente/comprimida de fotos finais no dispositivo.
- Criacao de Fighter ou Carta a partir de captura.
- Nome sugerido offline antes da chamada de IA.
- IA Gemini opcional sob demanda.
- Fallback deterministico quando IA nao esta disponivel.
- Modal de nome antes de criar item.
- Modal de revelacao.
- Inventario com deck pessoal + catalogo.
- Catalogo expõe origem/estado: cloud, seed por vazio/incompleto remoto ou seed por erro remoto.
- Filtros por tipo e raridade.
- Navegacao inferior e cartoes mobile com tratamento visual mais consistente e sem dependencia de emoji em labels operacionais.
- Exclusao de itens permitidos.
- Batalha mobile local completa com dois jogadores passando o celular.

### Supabase

- Cliente mobile com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Auth com sessao persistente.
- Schema inicial com tabelas de perfil, Fighters, Cartas e logs de batalha.
- RLS habilitado nas tabelas.
- Policies por `auth.uid()`.
- Sync de Fighters e Cartas pessoais.
- Estado de sync cloud exposto na home.

### Qualidade e CI

- GitHub Actions com Node 22.
- `npx expo install --check`.
- `npx tsc --noEmit`.
- `npm run test:core`.
- `npm run test:rls:catalog` para validacao real de RLS de catalogo quando `RLS_TEST_*` estiver configurado.
- `npm run check`.
- `npm run build`.
- `npm audit` zerado.
- Testes automatizados para balanceamento, factories, sugestao de cartas e batalha local.
- Checks estaticos para arquivos criticos, RLS basica, storage mobile e contrato Gemini/mock.
- Validacao RLS real de catalogo com usuario comum e dono.

## Parcial ou em validacao

- Sync cloud/local precisa de smoke mais formal de fluxo completo com usuario real, mas a hidratacao de auth/sync ja foi centralizada para evitar duplicidade por tela.
- Catalogo cloud tem contrato versionado com `is_catalog`; leitura publica anonima, escrita restrita a perfil com `can_manage_catalog = true`.
- Falha, vazio ou incompletude do catalogo remoto nao fica mais invisivel: o app preserva seed local para jogabilidade e expõe status/mensagem para a UI.
- Gemini sai pelo endpoint `gemini-transform` no Supabase Edge Functions; fallback offline continua quando a edge falha.
- Fotos novas usam `photo_storage_path` em bucket privado `snapquest-photos`, com signed URL para leitura e `photo_data_url` apenas como fallback legado.
- Cerimonia visual de transformacao ainda nao e a experiencia final desejada.

## Nao implementado

- XP, conquistas, diario de aventuras e colecoes completas.
- Multiplayer online.
- Publicacao em loja.

## Gaps tecnicos atuais

| ID | Gap | Impacto | Proxima acao |
|---|---|---|---|
| GAP-001 | Schema versionado de catalogo precisava alinhar `is_catalog` e permissao de escrita. | Catalogo cloud podia quebrar em banco novo. | Fechado: schema versionado e aplicado manualmente no Supabase em 2026-06-10. |
| GAP-002 | Gemini rodava no app com env publica. | Chave ficava exposta em bundle mobile. | Fechado em codigo; rollout operacional depende apenas do ambiente alvo. |
| GAP-003 | Fotos ainda nao usavam Storage remoto. | Peso no banco e risco de escalabilidade. | Fechado em codigo/schema; aplicar `supabase/schema.sql` no Supabase alvo e validar upload/leitura real. |
| GAP-004 | Cobertura automatizada de comportamento era inicial. | Regressao podia passar em cenarios de core nao cobertos. | Fechado: `npm run test:core` cobre balance, factories, sugestao de carta e batalha avancada. |
| GAP-005 | LCK/SPD nao tinham efeito completo. | Atributos pareciam mais ricos que a regra real. | Fechado: regra definida em `docs/battle-rules.md`, implementada no core e coberta por `npm run test:core`. |
| GAP-006 | RLS de catalogo ainda nao tinha prova real com usuario comum e usuario dono. | Risco fechado com evidencia funcional registrada. | Fechado: `npm run test:rls:catalog` passou no Supabase real em 2026-06-10. |

## Decisao atual

A prioridade tecnica recomendada agora e:

1. Cerimonia visual final;
2. smoke test mobile/web;
3. validar fluxo completo local/cloud em dispositivo apos rollout final de schema/storage.
