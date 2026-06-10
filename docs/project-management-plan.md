# Plano de Gerenciamento do Projeto SnapQuest

Data de referencia: 2026-06-10.

Este documento consolida a gestao do SnapQuest em formato PMBOK adaptado para um produto digital pequeno. Ele nao substitui o codigo nem os registros especializados; ele integra escopo, cronograma, qualidade, riscos, comunicacao, mudancas e criterios de aceite.

## 1. Termo de abertura resumido

| Campo | Definicao |
|---|---|
| Projeto | SnapQuest |
| Produto | Card game mobile-first onde fotos reais viram Fighters ou Cartas para batalha local. |
| Objetivo | Validar e evoluir um loop familiar de captura, colecao e batalha com base reutilizavel para mobile. |
| Entrega atual | MVP web preservado e MVP mobile Expo com captura, inventario, transformacao e batalha local. |
| Principal restricao | Segredos nao podem entrar no frontend. |
| Principal risco atual | RLS de catalogo precisa ser validada com usuario comum e usuario dono em ambiente real. |

## 2. Escopo do produto

### Em escopo atual

- MVP web com Vite.
- App mobile com Expo Router.
- Core de regras em JavaScript puro reutilizavel.
- Captura de foto por camera.
- Galeria para modo dono.
- Fila de capturas brutas.
- Criacao de Fighter ou Carta a partir da captura.
- Gemini opcional sob demanda, com fallback offline.
- Deck local persistente.
- Catalogo vindo da nuvem ou seed local.
- Login/cadastro Supabase.
- Sync Supabase de Fighters e Cartas.
- Batalha local entre dois jogadores.
- Documentacao viva.

### Fora de escopo atual

- Multiplayer online.
- Monetizacao.
- Loja.
- Supabase Storage em producao.
- Backend seguro para Gemini.
- Testes automatizados completos.
- Publicacao em loja mobile.
- Sistema completo de XP, conquistas e diario.

## 3. WBS resumida

| Codigo | Pacote de trabalho | Entregaveis |
|---|---|---|
| 1.0 | Fundacao | Governanca, docs, CI, checks estaticos. |
| 2.0 | MVP web | `index.html`, UI web, services web, Vite, Vercel. |
| 3.0 | Core de jogo | Fighters, Cards, Balance, Battle, tipos `.d.ts`. |
| 4.0 | Mobile Expo | Expo Router, telas, componentes, hooks. |
| 5.0 | Captura e transformacao | Camera, galeria, capturas brutas, persistencia de foto, Gemini/mock. |
| 6.0 | Inventario | Deck local, catalogo, filtros, exclusao, raridade. |
| 7.0 | Batalha | Setup, turnos, cartas, ataque, vencedor, passar celular. |
| 8.0 | Nuvem | Supabase Auth, tabelas, RLS, sync deck/catalogo. |
| 9.0 | Qualidade | TypeScript, Expo check, static check, build web, testes futuros. |

## 4. Linha de base de escopo

Uma mudanca so entra no projeto se puder ser classificada em um pacote da WBS. Mudancas que alterem banco, IA, batalha, UI, deploy ou documentacao devem atualizar os documentos correspondentes.

## 5. Cronograma por fases

| Fase | Status | Marco de saida |
|---|---|---|
| 0. Fundacao e governanca | Concluido | Docs base e regras de trabalho criadas. |
| 1. MVP web validado | Parcial | Loop web existe; UX/cloud web nao e final. |
| 2. Bootstrap Expo | Concluido | App mobile roda em estrutura Expo Router. |
| 3. Inventario mobile | Concluido em MVP | Deck, capturas, filtros, persistencia local. |
| 4. Batalha mobile | Concluido em MVP | Batalha local operacional. |
| 5. Cerimonia e IA | Em andamento | Revelacao existe; cerimonia visual final ainda nao. |
| 6. Produto familiar completo | Futuro | Progressao, colecoes, diario e eventos. |

## 6. Plano de qualidade

Fonte detalhada: `quality-management-plan.md`.

Gates minimos por PR:

- `npm run check`
- `npx tsc --noEmit`
- `npm run build` quando web/build for afetado
- `npx expo install --check` quando mobile/deps forem afetados
- revisao de segredo em `.env`, `.env.example`, Supabase e Gemini
- atualizacao de docs quando escopo, risco, debito ou arquitetura mudar

## 7. Plano de riscos

Fonte detalhada: `risk-register.md`.

Regras:

- Risco critico nao pode ficar sem dono e mitigacao.
- Risco novo deve entrar no registro ou virar issue.
- Risco aceito deve ter justificativa.

## 8. Plano de comunicacao

| Evento | Conteudo minimo |
|---|---|
| Abertura de PR | Escopo, fora de escopo, validacao, riscos, docs. |
| Handoff | Estado do repo, branch, comandos, pendencias, riscos. |
| Mudanca de fase | Roadmap, current-state, decision-log e riscos atualizados. |
| Incidente tecnico | Sintoma, impacto, causa provavel, mitigacao, proxima acao. |

## 9. Plano de mudancas

Fonte complementar: `change-control.md`.

Toda mudanca deve responder:

- Qual problema resolve?
- Qual pacote WBS toca?
- O que fica fora?
- Qual validacao prova que nao quebrou?
- Quais docs mudam?
- Qual risco novo ou reduzido surgiu?

## 10. Plano de configuracao

| Item | Fonte |
|---|---|
| Dependencias | `package.json` e `package-lock.json` |
| Web build | `vite.config.js`, `vercel.json` |
| Mobile | `app.json`, `src/app/`, Expo Router |
| Banco | `supabase/schema.sql` |
| Ambiente | `.env.example` |
| CI | `.github/workflows/ci.yml`, `.github/workflows/static-check.yml` |

## 11. Criterios de aceite do projeto

O projeto e considerado tecnicamente rastreavel quando:

- README aponta para os documentos centrais.
- Cada requisito relevante tem local de implementacao e validacao.
- Riscos e dividas conhecidos estao registrados.
- Documentos nao prometem comportamento inexistente.
- CI cobre no minimo typecheck, checks estaticos e build web.
- Lacunas tecnicas aparecem como pendencia explicita, nao como silencio.

## 12. Lacunas controladas

| ID | Lacuna | Plano |
|---|---|---|
| GAP-001 | Contrato de catalogo precisava de `is_catalog` e controle de admin. | Fechado: tratado no schema versionado e aplicado manualmente em 2026-06-10. |
| GAP-002 | Gemini roda no app com chave publica. | Migrar para backend/edge function antes de producao. |
| GAP-003 | Fotos ainda podem ir como `photo_data_url`. | Migrar para Supabase Storage. |
| GAP-004 | Poucos testes automatizados de comportamento. | Criar testes de core e smoke mobile/web. |
| GAP-005 | LCK e SPD nao tem efeito completo na batalha. | Definir regra de design e implementar em PR proprio. |
