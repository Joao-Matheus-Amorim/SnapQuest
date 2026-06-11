# Mapa do Projeto SnapQuest

Data de referencia: 2026-06-10.

Este documento descreve onde cada parte do SnapQuest vive e qual responsabilidade cada area possui.

## Raiz

| Caminho | Responsabilidade |
|---|---|
| `README.md` | Entrada principal do projeto. |
| `package.json` | Scripts, dependencias web/mobile e entry Expo. |
| `package-lock.json` | Lockfile npm. |
| `index.html` | Entrada do MVP web. |
| `vite.config.js` | Configuracao Vite SPA. |
| `vercel.json` | Build e rewrites do deploy web. |
| `app.json` | Configuracao Expo, plugins e permissoes. |
| `tsconfig.json` | TypeScript estrito baseado em Expo. |
| `.env.example` | Exemplo de variaveis publicas. |

## Mobile Expo

Local: `src/app/`

| Arquivo | Responsabilidade |
|---|---|
| `_layout.tsx` | Stack do Expo Router, `AuthProvider` global e ponte de sync cloud. |
| `index.tsx` | Home mobile gamificada: Mesa de Batalha, progresso de deck, quests, colecao e status de conta/sync. |
| `camera.tsx` | Portal de captura, camera, galeria no modo admin de catalogo, permissoes e orquestracao do salvamento de captura bruta. Helpers de URI/copia ficam em `src/lib/capturePhotoSource.ts`. |
| `inventory.tsx` | Camara do Grimorio: pendentes, transformacao, IA opcional, criacao, filtros, exclusao, revelacao e colecao visual por raridade. |
| `battle.tsx` | Batalha local completa, setup, turnos, selecao, cartas, ataques e vencedor. |
| `login.tsx` | Login/cadastro Supabase com guest mode e mensagens de confirmacao. |

## Componentes mobile

Local: `src/components/`

| Arquivo | Responsabilidade |
|---|---|
| `BottomNav.tsx` | HUD inferior mobile premium com runas de Base, Portal, Deck e Duelo. |
| `BattleLog.tsx` | Log visual de batalha. |
| `CardItem.tsx` | Renderizacao de Carta usando template colecionavel por raridade. |
| `FighterCard.tsx` | Renderizacao de Fighter usando template colecionavel por raridade. |
| `card/CardTemplate.tsx` | Template visual unico das cartas colecionaveis, com foto real, HP, habilidade, stats e raridade. |
| `card/cardFrameConfig.ts` | Registro das molduras por raridade, proporcao base, cores de classe/categoria e guarda de foto renderizavel. |
| `LegendaryAura.tsx` | Efeito visual para raridade/revelacao. |
| `NameInputModal.tsx` | Confirmacao de nome e acao de IA. |
| `RevealModal.tsx` | Revelacao do item final criado. |

## Hooks mobile

Local: `src/hooks/`

| Arquivo | Responsabilidade |
|---|---|
| `useAuth.ts` | Provider/hook de sessao Supabase, perfil `snapquest_profiles`, permissao de catalogo, login, cadastro e logout com limpeza de deck local. |
| `useCapturedPhotos.ts` | Fila local de capturas brutas. |
| `usePlayerDeck.ts` | Deck pessoal local, merge cloud, criacao e remocao de itens. |
| `useCatalog.ts` | Catalogo cloud com estado de origem e fallback para seed local. |
| `useInventory.ts` | Agrega deck pessoal + catalogo, estado do catalogo e requisitos de batalha. |
| `useBattle.ts` | Adapter React para o core de batalha. |
| `useCloudSync.ts` | Sincronizacao cloud quando aplicavel, com status compartilhado para UI. |

## Services e libs mobile

| Caminho | Responsabilidade |
|---|---|
| `src/services/cloudSync.ts` | Leitura/sync/delete de Fighters, Cartas e catalogo no Supabase. |
| `src/services/accountProfile.ts` | Garantia e leitura do perfil de conta, mais normalizacao de mensagens de auth. |
| `src/services/geminiTransform.ts` | Transformacao por Gemini real ou mock offline. |
| `src/lib/supabase.ts` | Cliente Supabase com storage de auth por plataforma. |
| `src/lib/mobileStorage.ts` | Adapter localStorage web + SecureStore/AsyncStorage native. |
| `src/lib/photoStorage.ts` | Compressao e persistencia permanente de fotos finais. |
| `src/lib/ownerConfig.ts` | Legado de identificacao por email; o mobile atual deriva admin do perfil `can_manage_catalog`. |
| `src/lib/rarityConfig.ts` | Calculo e metadata visual de raridade. |

## Core de jogo

Local: `src/js/core/`

Regra: esta pasta deve continuar sem DOM, React, Expo, Supabase ou Vercel.

| Arquivo | Responsabilidade |
|---|---|
| `balance.js` | Classes, categorias, atributos, golpes, misses e balanceamento. |
| `fighters.js` | Factory e seed de Fighters. |
| `cards.js` | Factory e seed de Cartas. |
| `battle.js` | Estado e regras da batalha local. |
| `utils.js` | Utilitarios puros. |
| `*.d.ts` | Contratos TypeScript para consumo no mobile. |

## MVP web

| Caminho | Responsabilidade |
|---|---|
| `src/js/app.js` | Orquestracao do MVP web. |
| `src/js/ui/dom.js` | Renderizacao DOM. |
| `src/js/ui/cloudAccount.js` | UI de conta/nuvem web. |
| `src/js/ui/cloudAccountAuto.js` | Automacao de conta/nuvem web. |
| `src/js/services/publicConfig.js` | Env publica no web. |
| `src/js/services/localStore.js` | Persistencia local web. |
| `src/js/services/supabaseClient.js` | Cliente Supabase web. |
| `src/js/services/inventoryRepository.js` | Repositorio de inventario web. |
| `src/js/services/cardSuggestionService.js` | Contrato de sugestao de carta por foto. |

## Banco

Local: `supabase/schema.sql`

Responsabilidade:

- criar tabelas do MVP;
- habilitar RLS;
- criar policies por usuario;
- criar trigger de `updated_at`.

Atencao: o app atual usa `is_catalog` para catalogo, e o schema versionado tambem declara `can_manage_catalog` para controlar escrita administrativa.

## Scripts e CI

| Caminho | Responsabilidade |
|---|---|
| `scripts/check.mjs` | Checks estaticos do projeto. |
| `scripts/check-card-suggestion.mjs` | Check especifico de sugestao de carta. |
| `.github/workflows/ci.yml` | Pipeline unica de CI com Expo check, TypeScript, testes core, static check e build. |

## Documentacao

Local: `docs/`

Fontes principais:

- `index.md`
- `project-management-plan.md`
- `requirements-traceability-matrix.md`
- `quality-management-plan.md`
- `current-state.md`
- `roadmap.md`
- `battle-rules.md`
- `risk-register.md`
- `technical-debt-register.md`

## Regras de dependencia

- `src/js/core/` nao importa UI, Supabase ou Expo.
- Mobile pode importar core e services mobile.
- Web pode importar core e services web.
- Banco e deploy devem mudar em PRs separados quando possivel.
- Documentacao deve mudar junto com comportamento ou contrato.
