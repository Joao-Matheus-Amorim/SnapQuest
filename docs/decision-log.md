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
