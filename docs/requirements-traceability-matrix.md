# Matriz de Rastreabilidade de Requisitos

Data de referencia: 2026-06-12.

Esta matriz liga requisito, implementacao, validacao e status. Ela deve ser atualizada quando o produto ganhar ou perder comportamento.

| ID | Requisito | Implementacao principal | Validacao atual | Status |
|---|---|---|---|---|
| REQ-001 | Preservar MVP web jogavel. | `index.html`, `src/js/app.js`, `src/styles/app.css` | `npm run build`, `npm run check` | Implementado |
| REQ-002 | Manter core de jogo separado da UI. | `src/js/core/` | `scripts/check.mjs` verifica arquivos core | Implementado |
| REQ-003 | Criar Fighters por regra pura. | `src/js/core/fighters.js` | `npm run test:core` e uso em mobile/web | Implementado |
| REQ-004 | Criar Cartas por regra pura. | `src/js/core/cards.js` | `npm run test:core` e uso em mobile/web | Implementado |
| REQ-005 | Executar batalha local. | `src/js/core/battle.js`, `src/hooks/useBattle.ts`, `src/app/battle.tsx`, `docs/battle-rules.md` | `npm run test:core` cobre turnos, energia, compra automatica, cartas, dano, classe, habilidades passivas, vacilo, queda e vencedor; TypeScript | Implementado |
| REQ-006 | Bloquear batalha sem inventario minimo. | `src/hooks/useInventory.ts`, `src/app/battle.tsx` | `npm run test:core`; regra lida via `canStartBattle` | Implementado |
| REQ-007 | Capturar foto no mobile. | `src/app/camera.tsx`, `expo-image-picker`, `expo-media-library` | TypeScript; check de `getAssetInfoAsync` | Implementado |
| REQ-008 | Guardar capturas brutas separadas do deck. | `src/hooks/useCapturedPhotos.ts` | `npm run check` verifica contrato | Implementado |
| REQ-009 | Persistir foto final em arquivo local permanente. | `src/lib/photoStorage.ts` | TypeScript | Implementado |
| REQ-010 | Transformar captura em Fighter ou Carta. | `src/app/inventory.tsx`, `src/services/geminiTransform.ts`, `usePlayerDeck.ts` | `npm run check` verifica rota por `transformCapturedPhoto` | Implementado |
| REQ-011 | Usar Gemini via backend quando a edge function estiver disponivel. | `src/services/geminiTransform.ts`, `supabase/functions/gemini-transform` | TypeScript; fallback em runtime; `npm run check` valida invoke da function | Implementado |
| REQ-012 | Ter fallback offline para IA indisponivel. | `mockTransform`, `mockFallback` | `npm run check` verifica provider mock | Implementado |
| REQ-013 | Permitir revisao de nome antes de criar item. | `src/components/NameInputModal.tsx`, `src/app/inventory.tsx` | TypeScript | Implementado |
| REQ-014 | Revelar item criado. | `src/components/RevealModal.tsx`, `src/components/LegendaryAura.tsx` | TypeScript | Implementado |
| REQ-015 | Persistir deck local. | `src/hooks/usePlayerDeck.ts`, `src/lib/mobileStorage.ts` | `npm run check` verifica storage web/native | Implementado |
| REQ-016 | Limpar deck local no logout. | `src/hooks/useAuth.ts`, `clearPlayerDeck` | TypeScript | Implementado |
| REQ-017 | Login/cadastro Supabase com mensagens de sessao e confirmacao. | `src/app/login.tsx`, `src/hooks/useAuth.ts`, `src/app/_layout.tsx`, `src/services/accountProfile.ts`, `src/lib/supabase.ts` | `npx tsc --noEmit`, `npm run check`, validacao local | Implementado |
| REQ-018 | Sincronizar deck pessoal com nuvem e expor estado de sync. | `src/services/cloudSync.ts`, `src/hooks/useCloudSync.ts`, `src/app/_layout.tsx`, `src/app/index.tsx` | `npx tsc --noEmit`, `npm run check`, validacao local | Implementado em MVP |
| REQ-019 | Carregar catalogo da nuvem com fallback seed e estado explicito. | `src/hooks/useCatalog.ts`, `src/hooks/useInventory.ts`, `src/services/cloudSync.ts`, `supabase/schema.sql` | TypeScript e check estatico de schema | Implementado e aplicado; validar leitura real |
| REQ-020 | Modo admin para catalogo via galeria. | `src/app/camera.tsx`, `src/app/inventory.tsx`, `src/hooks/useAuth.ts`, `snapquest_profiles.can_manage_catalog` | `npx tsc --noEmit`, `npm run check`, `npm run test:rls:catalog` | Implementado |
| REQ-021 | Proteger dados por usuario no banco. | `supabase/schema.sql` | `npm run check` verifica RLS e `auth.uid()` | Implementado para inventario pessoal |
| REQ-022 | Suportar catalogo compartilhado visivel sem login. | `cloudSync.ts`, `is_catalog`, `can_manage_catalog`, RLS, `scripts/validate-catalog-rls.mjs` | Check estatico de schema; `npm run test:rls:catalog` valida leitura anonima e escrita restrita | Implementado |
| REQ-023 | Evitar segredo privado no frontend. | `.env.example`, docs, `supabase.ts` | Revisao manual; check parcial | Implementado como regra |
| REQ-024 | Deploy web na Vercel. | `vercel.json`, `vite.config.js` | `npm run build` | Implementado |
| REQ-025 | CI minima. | `.github/workflows/ci.yml` | GitHub Actions com Expo check, test:core, typecheck, static check e build | Implementado |
| REQ-026 | Documentacao de governanca e estado. | `docs/` | Revisao documental | Implementado |
| REQ-027 | Apresentar a experiencia mobile com linguagem visual de jogo, nao dashboard generico. | `src/app/index.tsx`, `src/app/camera.tsx`, `src/components/BottomNav.tsx`, `src/components/FighterCard.tsx`, `src/components/CardItem.tsx`, `src/components/card/CardTemplate.tsx`, `src/components/NameInputModal.tsx` | `npx tsc --noEmit`, `npm run check`, validacao visual manual em dispositivo | Implementado em primeira passada |
| REQ-028 | Aplicar sistema de design premium "Arena + Arcano Petroleo & Magenta" com profundidade, movimento e haptics, respeitando acessibilidade. | `docs/design-language.md`, `src/theme/tokens.ts`, `src/lib/haptics.ts`, `src/lib/useReducedMotion.ts`, `src/components/game/*`, `src/components/motion/*`, `src/app/index.tsx`, `src/app/login.tsx`, `src/app/camera.tsx`, `src/app/inventory.tsx`, `src/app/battle.tsx`, `src/components/BottomNav.tsx`, `src/components/FighterCard.tsx`, `src/components/CardItem.tsx`, `src/components/card/CardTemplate.tsx`, `src/components/card/cardFrameConfig.ts`, `assets/card-frames/*`, `babel.config.cjs` | `npx tsc --noEmit`, `npm run check`, `npm run build`, validacao visual em dispositivo (Home, Login, BottomNav, Portal e Deck/Grimorio; Batalha ainda exige playtest real) | Implementado em Home/Login, BottomNav, Reveal, Portal e Deck/Grimorio; Batalha em refinamento funcional/visual |

## Gaps por requisito

| Requisito | Gap | Acao necessaria |
|---|---|---|
| REQ-018 | Sync ainda precisa de smoke mais formal em cenarios de erro offline e merge repetido. | Manter validacao manual em dispositivo ate existir smoke test automatizado; provider unico ja reduz duplicidade de sessao/sync. |
| REQ-019 | Catalogo precisa de validacao de leitura no fluxo app completo. | Validar leitura/cloud, seed por vazio/incompleto e seed por erro no app, alem do teste RLS direto. |
| REQ-025 | CI ainda nao cobre RLS real. | Manter `test:rls:catalog` como gate manual/local porque depende de usuarios reais. |
| REQ-027 | UI/UX gamificada ainda precisa de validacao visual em celular e refinamento de inventario/batalha. | Testar no dispositivo e continuar por telas, sem misturar banco/regra. |
| REQ-028 | Sistema premium ainda nao esta completo em todas as quatro areas: Base, Portal e Deck/Grimorio estao no padrao; Duelo esta em refinamento e precisa de validacao em Android real. Skia reservado para futuro dev build. | Validar Duelo em dispositivo, ajustar legibilidade/toque/arrasto e avaliar dev build quando quiser efeitos Skia. |

## Regra de manutencao

Nenhum requisito deve ficar com status "Implementado" sem pelo menos um local de codigo e uma validacao conhecida.
