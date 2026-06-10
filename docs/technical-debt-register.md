# Registro de Divida Tecnica

Ultima atualizacao: 2026-06-10.

| ID | Item | Motivo | Impacto | Plano | Status |
|---|---|---|---:|---|---|
| TD-001 | Fotos em `photo_data_url` no banco | MVP sem Storage remoto | Alto | Migrar para Supabase Storage e guardar URL | Aberto |
| TD-002 | Testes automatizados ainda minimos | Fase de validacao rapida | Alto | Fechado com `npm run test:core`: balance, factories, sugestao de carta e batalha avancada | Fechado |
| TD-003 | LCK e SPD sem efeito completo | Regra de batalha ainda simples | Medio | Fechado: LCK define faixa de critico; SPD define iniciativa e modificador de ataque capado; stats efetivos documentados e testados | Fechado |
| TD-004 | Auth/conta com UX de MVP | Validacao antes de polimento | Medio | Melhorar sessao, mensagens, estados e sync | Aberto |
| TD-005 | `App.tsx` legado ainda no repo | Entry atual usa Expo Router | Baixo | Remover ou marcar oficialmente quando nao for mais necessario | Aberto |
| TD-006 | Gemini chamado diretamente do app | Prototipo rapido de IA | Alto | Criar backend/edge function para proxy seguro | Aberto |
| TD-007 | Schema sem `is_catalog` usado pelo app | Evolucao de catalogo nao refletida no SQL | Critico | Fechado no schema versionado e aplicado manualmente em 2026-06-10 | Fechado |
| TD-008 | CI duplicada entre `ci.yml` e `static-check.yml` | Evolucao incremental | Baixo | Consolidar workflows ou documentar razao da duplicidade | Aberto |
| TD-009 | Catalogo compartilhado sem contrato RLS completo | Modo dono foi adicionado antes do desenho final de banco | Alto | Definir ownership, leitura publica/autenticada e escrita restrita | Aberto |
| TD-010 | `npm audit` reporta 16 vulnerabilidades moderadas | Dependencias Expo/Vite e transitivas exigem upgrades com risco de compatibilidade | Medio | Avaliar upgrade Expo/Vite em PR proprio, com Expo check, typecheck, build e teste em dispositivo | Aberto |
| TD-011 | RLS de catalogo sem teste funcional executado | Schema foi aplicado; harness documentado existe, mas falta rodar com usuario comum e dono reais | Alto | Preencher `RLS_TEST_*` no `.env`, rodar `npm run test:rls:catalog` e registrar evidencia | Aberto |

## Regra

Toda divida tecnica aceita deve ter:

- motivo;
- impacto;
- plano de remocao;
- status.

Divida tecnica nao documentada e considerada gap.
