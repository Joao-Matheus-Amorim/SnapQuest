# Controle de Mudancas

Fluxo obrigatorio:

```txt
Issue -> Branch -> PR -> Validacao -> Merge -> Documentacao
```

## Tipos de mudanca

- Correcao: bug ou regressao.
- Feature: nova capacidade.
- Documentacao: docs, checklist, roadmap ou governanca.
- Infra: CI, Vercel, Supabase, scripts ou estrutura.

## Template de PR

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

## Documentacao atualizada
- [ ] Sim
- [ ] Nao se aplica
```

## Bloqueios de merge

Nao fazer merge se houver:

- segredo sensivel no diff;
- arquivo temporario;
- schema SQL sem documentacao;
- mudanca grande demais;
- PR sem issue;
- validacao ausente tratada como concluida.
