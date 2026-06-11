# Registro de Decisoes

Este documento registra decisoes importantes do SnapQuest e o motivo de cada uma.

## D-001 — MVP web antes do app nativo

Data: 2026-06-09

Decisao: validar primeiro em web HTML/CSS/JS puro.

Motivo: reduzir custo, acelerar validacao pai e filho e provar o loop principal antes de investir em app nativo.

Consequencia: algumas partes web sao descartaveis no mobile, mas o core deve permanecer reutilizavel.

## D-002 — Core de jogo separado

Data: 2026-06-09

Decisao: manter regras em `src/js/core/` sem DOM e sem dependencia de plataforma.

Motivo: permitir reutilizacao no React Native + Expo.

Consequencia: UI web, UI mobile e services devem chamar o core, nao misturar regra com tela.

## D-003 — Supabase com chave publica no frontend

Data: 2026-06-09

Decisao: usar somente chave publishable/anon no frontend.

Motivo: evitar vazamento de segredo.

Consequencia: qualquer chave `sb_secret_` deve ser rejeitada no frontend.

## D-004 — Nao continuar refatorando UI web antes da migracao mobile

Data: 2026-06-09

Decisao: fechar PR web de UX de Conta/Nuvem e priorizar documentacao + bootstrap mobile.

Motivo: evitar gastar energia em UI que sera substituida por React Native.

Consequencia: melhorias de UX web devem ser apenas hotfixes necessarios.

## D-005 — Documentacao como skill obrigatoria

Data: 2026-06-09

Decisao: criar `docs/PROJECT-SKILL.md` como regra-mae.

Motivo: o projeto precisa saber sempre o que e, onde esta e para onde vai.

Consequencia: PRs devem atualizar docs quando mudarem estado, roadmap, risco, divida ou arquitetura.

## D-006 — Manter Expo Router no bootstrap mobile

Data: 2026-06-09

Decisao: manter Expo Router nesta fase do bootstrap mobile.

Motivo: o app abriu usando `expo-router/entry` e a estrutura `src/app/` ja estava criada. Remover o router agora aumentaria o escopo e poderia quebrar a validacao inicial.

Consequencia: o PR de bootstrap deve alinhar a navegacao inicial com Expo Router e nao misturar troca de arquitetura de navegacao com gameplay, Supabase, Gemini ou Storage.

## D-007 — Remover referencias a assets do template Expo

Data: 2026-06-09

Decisao: remover do `app.json` as referencias para assets do template Expo que nao existem no repositorio.

Motivo: o celular acusou `Unable to resolve asset "./assets/icon.png"` durante a validacao Expo Go.

Consequencia: o bootstrap fica sem icone customizado nesta fase. Icones/app assets devem entrar depois em PR proprio ou ajuste pequeno com arquivos reais.

## D-008 — Alinhar bootstrap Expo ao SDK 54 para validar no dispositivo real

Data: 2026-06-09

Decisao: rebaixar/alinhar o bootstrap mobile para Expo SDK 54 nesta fase, em vez de exigir SDK 56.

Motivo: o dispositivo fisico disponivel para validacao esta preso no Expo Go SDK 54 e nao permite atualizacao. Sem alinhar o projeto, a validacao manual do PR fica impossivel.

Consequencia: Expo SDK 56 fica como upgrade futuro em issue/PR proprio. O PR de bootstrap deve priorizar validacao real no dispositivo disponivel, preservando MVP web e `src/js/core/`.

## D-009 — Usar PMBOK adaptado como linha de base documental

Data: 2026-06-10

Decisao: consolidar plano de gerenciamento, matriz de rastreabilidade e plano de qualidade em `docs/project-management-plan.md`, `docs/requirements-traceability-matrix.md` e `docs/quality-management-plan.md`.

Motivo: o projeto ja possui web, mobile, banco, IA, CI e documentacao historica. Sem linha de base, fica facil criar gap entre promessa, codigo e validacao.

Consequencia: todo PR que muda comportamento, risco, divida, arquitetura ou qualidade deve avaliar esses documentos alem dos registros existentes.

## D-010 — Tratar catalogo Supabase como contrato versionado

Data: 2026-06-10

Decisao: versionar `is_catalog` nas tabelas de Fighters/Cartas e `can_manage_catalog` em perfis para controlar escrita administrativa de catalogo.

Motivo: o app atual consulta e grava catalogo via `is_catalog`; sem esse contrato no banco, um ambiente novo nao sustenta o fluxo.

Consequencia: o schema foi aplicado manualmente no Supabase em 2026-06-10. A validacao real com `npm run test:rls:catalog` passou em 2026-06-10.

## D-011 — Derivar administracao de catalogo do perfil RLS

Data: 2026-06-10

Decisao: o app mobile passa a derivar permissao administrativa de catalogo a partir de `snapquest_profiles.can_manage_catalog`, e nao mais de email publico como fonte principal.

Motivo: o contrato de acesso real ja vive no banco. Duplicar a decisao no frontend por email criava divergencia entre UX, RLS e operacao.

Consequencia: login garante a linha em `snapquest_profiles`, a home exibe estado de conta/sync, e camera/inventario obedecem a permissao real do perfil.

## D-012 — Fechar o audit sem salto de SDK

Data: 2026-06-10

Decisao: corrigir o `npm audit` sem promover upgrade major de Expo nesta frente, usando `vite@^6.4.3`, remocao de `@expo/ngrok` e `overrides` versionados para `postcss` e `uuid`.

Motivo: o problema estava concentrado em dependencias web/transitivas e podia ser resolvido sem reabrir a migracao de SDK nem misturar um upgrade estrutural de Expo com outras frentes.

Consequencia: `npm audit` zerou, `expo install --check`, `npx tsc --noEmit`, `npm run check` e `npm run build` permaneceram verdes, e o repositorio ganhou um contrato explicito para evitar regressao dessa correção.

## D-013 - Centralizar auth e tornar fallback de catalogo visivel

Data: 2026-06-10

Decisao: montar `AuthProvider` uma unica vez no layout mobile e expor estado/origem do catalogo (`cloud`, seed por vazio/incompleto remoto ou seed por erro remoto).

Motivo: varias telas liam `useAuth()` diretamente, o que podia duplicar hidratacao de sessao/perfil. Alem disso, erro real de catalogo podia virar seed local sem sinal claro para a UI.

Consequencia: telas continuam usando `useAuth()`, mas agora por contexto global. O sync cloud roda por uma ponte no layout e o inventario pode mostrar aviso discreto quando o catalogo remoto nao esta sendo usado.

## D-014 - Direcao visual mobile gamificada

Data: 2026-06-10

Decisao: orientar a UI mobile para linguagem de card game familiar, com Home como Mesa de Batalha, camera como Portal de Captura e navegacao inferior como HUD de jogo.

Motivo: a primeira abordagem visual ficou parecida com dashboard generico e nao comunicava fantasia, colecao, duelo nem transformacao por foto.

Consequencia: telas de entrada devem priorizar sensacao de jogo, progresso de deck e acoes de aventura. Interfaces operacionais continuam densas quando necessario, mas nao devem parecer landing page ou painel SaaS.

## D-015 - Travar mundo Arena + paleta Arcano Petroleo & Magenta como norte de design

Data: 2026-06-11

Decisao: adotar formalmente duas ideias validadas em dispositivo como contrato de design (`docs/design-language.md`): (1) mundo visual Arena estilo Clash Royale (game-feel, profundidade, cena viva, botoes 3D, HUD), e (2) paleta Arcano Petroleo & Magenta (base petroleo, magenta acao, ciano acento, ouro pontual, branco-frio, azul ambiente). Stack de UI: Reanimated 4 (worklets), expo-linear-gradient, react-native-svg, expo-haptics, gesture-handler; Skia instalado mas reservado para futuro dev build por nao existir no Expo Go.

Motivo: a UI mobile passou por refinamentos ate validar um padrao premium coeso; sem travar paleta e linguagem, cada tela divergia e o resultado parecia dashboard. As duas direcoes anteriores haviam sido recusadas por ficarem amadoras ou administrativas.

Consequencia: `src/theme/tokens.ts` e a fonte unica de cores/molas. Toda tela nova ou refino segue `docs/design-language.md`. Home e Conta/Login ja estao no padrao; Camera, Grimorio, Reveal, Batalha e BottomNav devem ser migrados sem misturar com banco/RLS/Storage/Gemini/regra de batalha.
