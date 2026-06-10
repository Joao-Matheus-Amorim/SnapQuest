# Politica de Documentacao

Esta politica define quando e como a documentacao do SnapQuest deve ser atualizada.

## Regra geral

Todo PR que muda comportamento, arquitetura, deploy, banco, seguranca, roadmap, risco ou divida tecnica deve atualizar documentacao.

Se a documentacao nao precisar mudar, o PR deve explicar o motivo.

## Documentos que devem ser avaliados em todo PR

- `docs/index.md`
- `docs/project-management-plan.md`
- `docs/requirements-traceability-matrix.md`
- `docs/quality-management-plan.md`
- `docs/current-state.md`
- `docs/project-map.md`
- `docs/roadmap.md`
- `docs/decision-log.md`
- `docs/risk-register.md`
- `docs/technical-debt-register.md`
- `docs/PROJECT-SKILL.md`

## Quando atualizar cada documento

### current-state.md

Atualizar quando algo entra, sai, quebra, fica pendente ou muda de status.

### project-map.md

Atualizar quando arquivos, pastas ou responsabilidades mudarem.

### roadmap.md

Atualizar quando uma fase avancar, mudar de prioridade ou for cancelada.

### decision-log.md

Atualizar quando uma decisao tecnica ou de produto for tomada.

### risk-register.md

Atualizar quando surgir risco novo ou risco existente mudar de status.

### technical-debt-register.md

Atualizar quando uma divida for aceita, reduzida, removida ou descoberta.

## Como lidar com documento ultrapassado

Nunca deixar documento antigo parecendo atual.

Escolha uma acao:

1. Atualizar.
2. Marcar como obsoleto no topo.
3. Substituir por documento novo e linkar a nova fonte da verdade.
4. Remover apenas se nao houver valor historico.

## Proibicoes

- Documentar como concluido algo nao validado.
- Criar nota temporaria no `main`.
- Usar docs para esconder falha de CI.
- Dizer que deploy passou se ele esta rate limited ou pendente.
- Deixar roadmap contradizendo o codigo.

## Template minimo para PR

```md
Closes #issue

## Resumo
-

## Escopo
-

## Fora do escopo
-

## Validacao
-

## Riscos restantes
-

## Documentacao
- [ ] Atualizada
- [ ] Nao se aplica, motivo:
```
