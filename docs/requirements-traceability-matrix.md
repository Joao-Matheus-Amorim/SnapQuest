# Matriz de Rastreabilidade de Requisitos

Data de referencia: 2026-06-10.

Esta matriz liga requisito, implementacao, validacao e status. Ela deve ser atualizada quando o produto ganhar ou perder comportamento.

| ID | Requisito | Implementacao principal | Validacao atual | Status |
|---|---|---|---|---|
| REQ-001 | Preservar MVP web jogavel. | `index.html`, `src/js/app.js`, `src/styles/app.css` | `npm run build`, `npm run check` | Implementado |
| REQ-002 | Manter core de jogo separado da UI. | `src/js/core/` | `scripts/check.mjs` verifica arquivos core | Implementado |
| REQ-003 | Criar Fighters por regra pura. | `src/js/core/fighters.js` | Check estatico e uso em mobile/web | Implementado |
| REQ-004 | Criar Cartas por regra pura. | `src/js/core/cards.js` | Check estatico e uso em mobile/web | Implementado |
| REQ-005 | Executar batalha local. | `src/js/core/battle.js`, `src/hooks/useBattle.ts`, `src/app/battle.tsx` | TypeScript e uso manual esperado | Implementado em MVP |
| REQ-006 | Bloquear batalha sem inventario minimo. | `src/hooks/useInventory.ts`, `src/app/battle.tsx` | TypeScript; regra lida via `canStartBattle` | Implementado |
| REQ-007 | Capturar foto no mobile. | `src/app/camera.tsx`, `expo-image-picker`, `expo-media-library` | TypeScript; check de `getAssetInfoAsync` | Implementado |
| REQ-008 | Guardar capturas brutas separadas do deck. | `src/hooks/useCapturedPhotos.ts` | `npm run check` verifica contrato | Implementado |
| REQ-009 | Persistir foto final em arquivo local permanente. | `src/lib/photoStorage.ts` | TypeScript | Implementado |
| REQ-010 | Transformar captura em Fighter ou Carta. | `src/app/inventory.tsx`, `src/services/geminiTransform.ts`, `usePlayerDeck.ts` | `npm run check` verifica rota por `transformCapturedPhoto` | Implementado |
| REQ-011 | Usar Gemini real quando chave existir. | `src/services/geminiTransform.ts` | TypeScript; fallback em runtime | Implementado com risco |
| REQ-012 | Ter fallback offline para IA indisponivel. | `mockTransform`, `mockFallback` | `npm run check` verifica provider mock | Implementado |
| REQ-013 | Permitir revisao de nome antes de criar item. | `src/components/NameInputModal.tsx`, `src/app/inventory.tsx` | TypeScript | Implementado |
| REQ-014 | Revelar item criado. | `src/components/RevealModal.tsx`, `src/components/LegendaryAura.tsx` | TypeScript | Implementado |
| REQ-015 | Persistir deck local. | `src/hooks/usePlayerDeck.ts`, `src/lib/mobileStorage.ts` | `npm run check` verifica storage web/native | Implementado |
| REQ-016 | Limpar deck local no logout. | `src/hooks/useAuth.ts`, `clearPlayerDeck` | TypeScript | Implementado |
| REQ-017 | Login/cadastro Supabase. | `src/app/login.tsx`, `src/hooks/useAuth.ts`, `src/lib/supabase.ts` | TypeScript | Implementado em MVP |
| REQ-018 | Sincronizar deck pessoal com nuvem. | `src/services/cloudSync.ts` | TypeScript | Parcial |
| REQ-019 | Carregar catalogo da nuvem com fallback seed. | `src/hooks/useCatalog.ts`, `src/services/cloudSync.ts`, `supabase/schema.sql` | TypeScript e check estatico de schema | Implementado e aplicado; validar leitura real |
| REQ-020 | Modo dono para catalogo via galeria. | `src/app/camera.tsx`, `src/app/inventory.tsx`, `src/lib/ownerConfig.ts` | TypeScript | Implementado com risco de schema |
| REQ-021 | Proteger dados por usuario no banco. | `supabase/schema.sql` | `npm run check` verifica RLS e `auth.uid()` | Implementado para inventario pessoal |
| REQ-022 | Suportar catalogo compartilhado. | `cloudSync.ts`, `is_catalog`, `can_manage_catalog`, RLS | Check estatico de schema; falta teste real de RLS | Implementado e aplicado; validar RLS real |
| REQ-023 | Evitar segredo privado no frontend. | `.env.example`, docs, `supabase.ts` | Revisao manual; check parcial | Implementado como regra |
| REQ-024 | Deploy web na Vercel. | `vercel.json`, `vite.config.js` | `npm run build` | Implementado |
| REQ-025 | CI minima. | `.github/workflows/ci.yml`, `.github/workflows/static-check.yml` | GitHub Actions | Implementado |
| REQ-026 | Documentacao de governanca e estado. | `docs/` | Revisao documental | Implementado |

## Gaps por requisito

| Requisito | Gap | Acao necessaria |
|---|---|---|
| REQ-018 | Sync depende de contrato cloud ainda pouco testado. | Testar login, merge local/cloud e erro offline. |
| REQ-019 | Catalogo precisa de evidencia de leitura real no Supabase aplicado. | Validar leitura/fallback no app. |
| REQ-022 | RLS de catalogo precisa ser provada com usuario comum e dono. | Criar teste/roteiro de RLS e executar no Supabase. |
| REQ-025 | CI nao roda testes de gameplay porque eles ainda nao existem. | Adicionar suite de core. |

## Regra de manutencao

Nenhum requisito deve ficar com status "Implementado" sem pelo menos um local de codigo e uma validacao conhecida.
