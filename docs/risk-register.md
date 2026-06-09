# Registro de Riscos

| ID | Risco | Impacto | Probabilidade | Mitigacao | Status |
|---|---|---:|---:|---|---|
| R-001 | Misturar gameplay, banco e deploy no mesmo PR | Alto | Media | PR pequeno por escopo | Aberto |
| R-002 | Expor `service_role` no frontend | Critico | Baixa | Usar somente anon key e revisar diffs | Aberto |
| R-003 | RLS incorreto permitir acesso cruzado | Critico | Media | Politicas com `auth.uid()` e testes futuros | Aberto |
| R-004 | Prototipo virar codigo final sem refatoracao | Alto | Media | Separar `core`, `services` e `ui` | Em mitigacao |
| R-005 | Deploy funcionar sem banco validado | Medio | Media | Checklist Vercel + Supabase | Aberto |
| R-006 | Documentacao prometer recurso nao entregue | Alto | Media | Atualizar docs apenas com estado real | Aberto |
| R-007 | Arquivos temporarios entrarem no repo | Medio | Media | Checklist de PR e revisao de diff | Aberto |

## Regra

Todo risco novo deve virar issue ou atualizar este registro.
