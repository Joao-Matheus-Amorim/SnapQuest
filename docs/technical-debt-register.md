# Registro de Divida Tecnica

Ultima atualizacao: 2026-06-10.

| ID | Item | Motivo | Impacto | Plano | Status |
|---|---|---|---:|---|---|
| TD-001 | Fotos em `photo_data_url` no banco | MVP sem Storage remoto | Alto | Fechado em codigo/schema: `photo_storage_path`, bucket privado `snapquest-photos`, signed URLs e fallback legado de leitura | Fechado |
| TD-002 | Testes automatizados ainda minimos | Fase de validacao rapida | Alto | Fechado com `npm run test:core`: balance, factories, sugestao de carta e batalha avancada | Fechado |
| TD-003 | LCK e SPD sem efeito completo | Regra de batalha ainda simples | Medio | Fechado: LCK define faixa de critico; SPD define iniciativa e modificador de ataque capado; stats efetivos documentados e testados | Fechado |
| TD-004 | Auth/conta com UX de MVP | Validacao antes de polimento | Medio | Fechado: sessao agora garante `snapquest_profiles`, login/cadastro distinguem confirmacao de email, home exibe estado de conta/sync e modo admin deriva do perfil | Fechado |
| TD-005 | `App.tsx` legado ainda no repo | Entry atual usa Expo Router | Baixo | Fechado: `App.tsx` foi removido e o entry mobile ficou consolidado em `expo-router/entry` | Fechado |
| TD-006 | Gemini chamado diretamente do app | Prototipo rapido de IA | Alto | Fechado: app chama `gemini-transform` via Supabase Edge Function, com secrets privados no backend e fallback offline preservado | Fechado |
| TD-007 | Schema sem `is_catalog` usado pelo app | Evolucao de catalogo nao refletida no SQL | Critico | Fechado no schema versionado e aplicado manualmente em 2026-06-10 | Fechado |
| TD-008 | CI duplicada entre `ci.yml` e `static-check.yml` | Evolucao incremental | Baixo | Fechado: workflow redundante removido; `ci.yml` ficou como pipeline unica com Expo check, typecheck, testes core, check estatico e build | Fechado |
| TD-009 | Catalogo compartilhado sem contrato RLS completo | Modo dono foi adicionado antes do desenho final de banco | Alto | Fechado: ownership, leitura publica do catalogo, escrita restrita ao dono e bloqueio de autopromocao foram validados por `npm run test:rls:catalog` | Fechado |
| TD-010 | `npm audit` reportava vulnerabilidades moderadas | Dependencias Expo/Vite e transitivas exigiam revisao cuidadosa para nao quebrar o stack atual | Medio | Fechado: `vite` foi atualizado para `^6.4.3`, `@expo/ngrok` foi removido e `overrides` de `postcss`/`uuid` zeraram o `npm audit` sem quebrar Expo check, typecheck ou build | Fechado |
| TD-011 | RLS de catalogo sem evidencia funcional | Schema foi aplicado; faltava evidencia real com usuario comum e dono | Alto | Fechado: `npm run test:rls:catalog` passou no Supabase real em 2026-06-10 e evidencia foi registrada | Fechado |

## Regra

Toda divida tecnica aceita deve ter:

- motivo;
- impacto;
- plano de remocao;
- status.

Divida tecnica nao documentada e considerada gap.
