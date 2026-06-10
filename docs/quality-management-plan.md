# Plano de Gerenciamento da Qualidade

Data de referencia: 2026-06-10.

Este plano define como o SnapQuest previne falso verde, regressao e documentacao enganosa.

## Objetivos de qualidade

- Garantir que o MVP web continue buildando.
- Garantir que o app mobile mantenha type safety.
- Garantir que o core de jogo siga separado da UI.
- Garantir que nenhum segredo privado entre no frontend.
- Garantir que lacunas tecnicas conhecidas estejam registradas.
- Garantir que docs reflitam codigo real.

## Gates obrigatorios

| Gate | Comando | Quando rodar |
|---|---|---|
| Dependencias limpas | `npm ci` | Setup e CI |
| Expo dependency check | `npx expo install --check` | Mudancas mobile/deps |
| Core tests | `npm run test:core` | Mudancas em core, batalha, factories, balanceamento ou sugestao de cartas |
| TypeScript | `npx tsc --noEmit` | Todo PR com TS/TSX |
| Static check | `npm run check` | Todo PR |
| Web build | `npm run build` | Mudancas web/build/config |
| Catalog RLS real | `npm run test:rls:catalog` | Mudancas em Supabase/catalogo/RLS, com `RLS_TEST_*` local |
| Security audit | `npm audit` | Revisao de dependencias; bloqueio manual quando houver high/critical |
| Revisao de docs | Manual | Todo PR com comportamento, arquitetura, risco ou debito |

## Cobertura atual

| Area | Cobertura | Lacuna |
|---|---|---|
| Presenca de arquivos criticos | `scripts/check.mjs` | Nao valida comportamento real completo. |
| Core de jogo | `npm run test:core` cobre balanceamento, factories, sugestao de cartas, compra, cartas, dano, turno, vencedor, critico, falha critica, matchup e reserva | Nao substitui E2E mobile nem validacao RLS real. |
| RLS basica | `scripts/check.mjs` busca RLS e `auth.uid()`; `npm run test:rls:catalog` prova fluxo real quando credenciais `RLS_TEST_*` existem | Execucao real ainda depende de usuarios de teste no Supabase. |
| Mobile storage | `scripts/check.mjs` verifica fallback web/native | Nao testa falhas reais de plataforma. |
| Gemini/mock | `scripts/check.mjs` verifica contrato basico | Nao testa API real nem cota. |
| TypeScript | `npx tsc --noEmit` | Nao substitui teste funcional. |
| Web build | `npm run build` | Nao valida navegacao manual. |
| Dependency audit | `npm audit` reporta 16 moderadas | Correcoes sugeridas envolvem upgrades major de Expo/Vite e precisam de PR proprio. |

## Criterios de qualidade por area

### Core de jogo

- Nao pode depender de DOM, React, Supabase, Expo ou browser APIs.
- Deve ser reutilizavel por web e mobile.
- Mudanca de regra deve atualizar docs e, futuramente, testes unitarios.

### Mobile

- Deve usar `EXPO_PUBLIC_` para env publica.
- Deve manter capturas brutas fora do deck ate confirmacao.
- Deve manter foto persistida antes de remover captura bruta.
- Deve tratar IA como opcional e recuperavel.

### Supabase

- Frontend usa somente anon/public key.
- `service_role` e chaves privadas sao proibidas.
- RLS precisa estar ligada em todas as tabelas de dados de usuario.
- Alteracao de schema exige atualizacao de `docs/database.md`.

### IA/Gemini

- Resposta do modelo deve ser JSON normalizado.
- Erro, cota ou modelo inexistente deve cair em fallback.
- Antes de producao, chamada Gemini deve sair do app e ir para backend/edge function.

### Documentacao

- Documento nao pode dizer "concluido" sem validacao.
- Documento historico pode permanecer, mas deve estar marcado como historico quando ficar obsoleto.
- `current-state.md` e a fonte de verdade documental do estado atual.

## Definicao de pronto

Um PR esta pronto quando:

- Escopo e fora de escopo estao claros.
- Gates aplicaveis passaram ou foram declarados como pendentes com motivo.
- Riscos novos foram registrados.
- Dividas novas foram registradas.
- Docs foram atualizados.
- Nenhum arquivo temporario ou segredo foi adicionado.

## Plano de melhoria de qualidade

| Prioridade | Melhoria | Motivo |
|---|---|---|
| Alta | Executar `npm run test:rls:catalog` e registrar evidencia | Harness existe; falta preencher usuarios `RLS_TEST_*` e rodar contra Supabase real. |
| Alta | Plano de upgrade para vulnerabilidades moderadas | `npm audit` aponta Expo/Vite/transitivas com upgrades potencialmente quebradores. |
| Media | Smoke test mobile/web | Prova minima de navegacao principal. |
| Media | Check automatizado contra `service_role` e `sb_secret_` | Evita vazamento acidental. |
| Baixa | Snapshot visual de componentes principais | Ajuda apos estabilizar UI. |
