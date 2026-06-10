# SnapQuest Project Skill

Este documento e a regra-mae de documentacao e ciencia do projeto SnapQuest.

A skill existe para impedir que o projeto avance sem contexto, sem rastreabilidade ou com documentacao divergente do codigo.

## Regra central

Antes de implementar, revisar ou migrar qualquer parte do SnapQuest, o trabalho deve responder:

1. O que e isto?
2. Por que existe?
3. Onde esta no repositorio?
4. Qual estado real hoje?
5. Para onde vai?
6. Quais riscos existem?
7. Qual divida tecnica foi aceita?
8. Qual proximo passo seguro?

Se alguma resposta estiver incerta, o trabalho deve parar e registrar o gap em issue ou documentacao.

## Fontes oficiais

A documentacao viva do projeto fica em:

- `docs/index.md`: indice oficial.
- `docs/PROJECT-SKILL.md`: regras da skill.
- `docs/project-management-plan.md`: plano integrado PMBOK adaptado.
- `docs/requirements-traceability-matrix.md`: requisitos, codigo, validacao e status.
- `docs/quality-management-plan.md`: gates e criterios de qualidade.
- `docs/current-state.md`: estado real atual.
- `docs/project-map.md`: mapa de arquivos, responsabilidades e fronteiras.
- `docs/roadmap.md`: direcao do produto e fases.
- `docs/decision-log.md`: decisoes arquiteturais tomadas.
- `docs/documentation-policy.md`: regras para atualizar docs em PRs.
- `docs/risk-register.md`: riscos conhecidos.
- `docs/technical-debt-register.md`: dividas tecnicas assumidas.
- `docs/project-governance.md`: governanca PMBOK adaptada.
- `docs/change-control.md`: controle de mudancas.

## Obrigatorio em todo PR

Todo PR deve informar:

- issue vinculada;
- resumo;
- escopo;
- fora do escopo;
- validacao feita;
- riscos restantes;
- docs atualizadas ou motivo para nao atualizar.

## Proibido

- Documentacao afirmar algo que nao foi validado.
- Misturar migracao mobile, schema, gameplay, UI e infra no mesmo PR.
- Tratar build ou deploy pendente como concluido.
- Usar arquivos temporarios, notas soltas ou placeholders no `main`.
- Expor chaves secretas em frontend ou exemplos.

## Regra para funcionalidades

A Home nao e deposito de funcionalidades.

Cada funcionalidade deve ter local proprio de desenvolvimento:

- Home: resumo do jogo e acoes principais.
- Conta/Nuvem: login, cadastro, sessao, sincronizacao.
- Lutadores: criacao, listagem, edicao futura.
- Cartas: criacao, listagem, edicao futura.
- Inventario: colecao organizada.
- Batalha: fluxo de combate.
- Configuracoes: ajustes tecnicos/dev quando necessario.
- Mobile/Expo: app nativo em estrutura propria.

## Estado de verdade

Se conversa, README e codigo discordarem, a ordem de confianca e:

1. Codigo atual em `main`.
2. Issues e PRs abertos/fechados.
3. `docs/current-state.md`.
4. Demais documentos.
5. Conversas antigas.

Quando uma divergencia for encontrada, atualizar docs antes de continuar a feature.
