# Estado Atual do SnapQuest

Ultima atualizacao: 2026-06-10.

## Resumo executivo

SnapQuest e um card game mobile-first em validacao. O produto transforma fotos reais em Fighters ou Cartas e usa esses itens em batalhas locais por turnos.

O repositorio possui:

- MVP web preservado com Vite.
- App mobile Expo em MVP funcional.
- Core de jogo reutilizavel em `src/js/core/`.
- Supabase Auth/DB integrado em nivel inicial.
- Gemini real opcional com fallback offline.
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
- Login/cadastro Supabase.
- Logout limpando deck local.
- Captura por camera.
- Galeria no modo dono.
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
- Filtros por tipo e raridade.
- Exclusao de itens permitidos.
- Batalha mobile local completa com dois jogadores passando o celular.

### Supabase

- Cliente mobile com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Auth com sessao persistente.
- Schema inicial com tabelas de perfil, Fighters, Cartas e logs de batalha.
- RLS habilitado nas tabelas.
- Policies por `auth.uid()`.
- Sync de Fighters e Cartas pessoais.

### Qualidade e CI

- GitHub Actions com Node 22.
- `npx expo install --check`.
- `npx tsc --noEmit`.
- `npm run test:core`.
- `npm run test:rls:catalog` para validacao real de RLS de catalogo quando `RLS_TEST_*` estiver configurado.
- `npm run check`.
- `npm run build`.
- Testes automatizados para balanceamento, factories, sugestao de cartas e batalha local.
- Checks estaticos para arquivos criticos, RLS basica, storage mobile e contrato Gemini/mock.
- Validacao RLS real de catalogo com usuario comum e dono.

## Parcial ou em validacao

- Sync cloud/local precisa de validacao de fluxo completo com usuario real.
- Catalogo cloud tem contrato versionado com `is_catalog`; schema aplicado manualmente no Supabase em 2026-06-10; escrita de catalogo depende de perfil com `can_manage_catalog = true`.
- Auth existe, mas UX de conta ainda e MVP.
- Gemini funciona como chamada publica no app; aceitavel para prototipo, nao para producao.
- Fotos finais podem ser sincronizadas como `photo_data_url`; Storage remoto ainda nao foi implantado.
- Cerimonia visual de transformacao ainda nao e a experiencia final desejada.

## Nao implementado

- Supabase Storage para fotos.
- Backend/edge function para proteger chamada Gemini.
- XP, conquistas, diario de aventuras e colecoes completas.
- Multiplayer online.
- Publicacao em loja.

## Gaps tecnicos atuais

| ID | Gap | Impacto | Proxima acao |
|---|---|---|---|
| GAP-001 | Schema versionado de catalogo precisava alinhar `is_catalog` e permissao de escrita. | Catalogo cloud podia quebrar em banco novo. | Fechado: schema versionado e aplicado manualmente no Supabase em 2026-06-10. |
| GAP-002 | Gemini roda no app com env publica. | Chave fica exposta em bundle mobile. | Mover para backend/edge antes de producao. |
| GAP-003 | Fotos ainda nao usam Storage remoto. | Peso no banco e risco de escalabilidade. | Criar bucket e guardar URLs. |
| GAP-004 | Cobertura automatizada de comportamento era inicial. | Regressao podia passar em cenarios de core nao cobertos. | Fechado: `npm run test:core` cobre balance, factories, sugestao de carta e batalha avancada. |
| GAP-005 | LCK/SPD nao tinham efeito completo. | Atributos pareciam mais ricos que a regra real. | Fechado: regra definida em `docs/battle-rules.md`, implementada no core e coberta por `npm run test:core`. |
| GAP-006 | RLS de catalogo ainda nao tinha prova real com usuario comum e usuario dono. | Risco fechado com evidencia funcional registrada. | Fechado: `npm run test:rls:catalog` passou no Supabase real em 2026-06-10. |

## Decisao atual

A prioridade tecnica recomendada agora e:

1. Storage para fotos;
2. Gemini via backend/edge;
3. cerimonia visual final;
4. smoke test mobile/web.
