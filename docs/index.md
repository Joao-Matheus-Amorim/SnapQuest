# Indice de Documentacao

Data de referencia: 2026-06-12.

Este indice e a porta de entrada oficial para a documentacao do SnapQuest.

## Gestao PMBOK adaptada

- `project-management-plan.md`: plano integrado de gerenciamento do projeto.
- `requirements-traceability-matrix.md`: matriz entre requisitos, codigo, validacao e status.
- `quality-management-plan.md`: plano de qualidade, gates e evidencias.
- `project-governance.md`: regras de trabalho, PR, decisao e definicao de pronto.
- `change-control.md`: controle de mudancas.

## Produto e estado

- `current-state.md`: estado real do produto e lacunas conhecidas.
- `mvp-scope.md`: escopo do MVP.
- `roadmap.md`: fases, status e proximas entregas.
- `decision-log.md`: decisoes tecnicas e de produto.

## Arquitetura e operacao

- `project-map.md`: mapa dos diretorios e responsabilidades.
- `database.md`: banco Supabase, RLS e pendencias.
- `catalog-rls-validation.md`: roteiro executavel para validar RLS do catalogo com usuario comum e dono.
- `deploy-vercel.md`: deploy web.
- `rn-migration.md`: historico e status da migracao React Native + Expo.
- `battle-rules.md`: contrato de regras de batalha, energia, compra automatica, cartas, dano, classe, habilidades, vacilo e vencedor.
- `gemini-transform-flow.md`: fluxo foto -> IA -> item jogavel.
- `gemini-card-suggestions.md`: contrato de sugestao de cartas.

## Controle de risco e debito

- `risk-register.md`: riscos ativos, impacto e mitigacao.
- `technical-debt-register.md`: dividas tecnicas aceitas, impacto e plano.
- `documentation-policy.md`: quando e como atualizar docs.

## Regra de uso

Em caso de conflito entre documentos, a prioridade e:

1. Codigo versionado.
2. `current-state.md`.
3. `project-management-plan.md`.
4. Documentos especificos por area.
5. Historico em `decision-log.md`.

Se a documentacao divergir do codigo, isso deve virar ajuste imediato de docs ou issue tecnica.
