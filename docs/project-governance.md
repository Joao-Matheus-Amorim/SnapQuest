# Governança do Projeto SnapQuest

Este documento define o modo oficial de trabalho do SnapQuest para evitar gambiarra, dívida técnica, falso verde e gaps de rastreabilidade.

## Princípios obrigatórios

- Todo trabalho deve nascer de uma issue.
- Toda alteração deve acontecer em branch própria.
- Todo merge deve passar por PR.
- PR pequeno é obrigatório.
- Não misturar escopos diferentes no mesmo PR.
- Banco, deploy, batalha, UI, documentação e arquitetura devem ser tratados separadamente.
- Nenhum segredo sensível pode ser colocado no frontend.
- Nenhum `service_role` pode entrar no código do navegador, Vercel frontend ou arquivos `.env.example`.
- Documentação deve refletir o estado real do projeto.
- Se uma validação não foi feita, ela deve ser marcada como pendente, não como concluída.

## Fluxo PMBOK adaptado

```txt
1. Identificar necessidade, risco ou gap
2. Registrar issue
3. Definir escopo e fora de escopo
4. Criar branch a partir de main atualizado
5. Implementar somente o escopo aprovado
6. Validar localmente ou por CI
7. Abrir PR com resumo, validação e riscos
8. Revisar diff
9. Fazer merge apenas se estiver consistente
10. Atualizar documentação/status
```

## Critérios para aceitar PR

Um PR só pode ser aceito se responder:

- Qual issue ele fecha?
- O que mudou?
- O que ficou fora do escopo?
- Como foi validado?
- Quais riscos restam?
- Alguma documentação precisa ser atualizada?

## Escopos que não devem ser misturados

- Gameplay e regras de batalha.
- Supabase schema/RLS.
- Supabase Auth/Storage.
- Deploy Vercel.
- UI/visual.
- Documentação.
- Migração futura para Expo.
- IA/Gemini.

## Definição de pronto

- Código no escopo.
- Sem arquivo temporário.
- Sem segredo sensível.
- Sem schema alterado sem documentação.
- Sem promessa de funcionalidade não validada.
- PR rastreado por issue.
- Documentação atualizada quando necessário.
