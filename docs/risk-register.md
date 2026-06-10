# Registro de Riscos

Ultima atualizacao: 2026-06-10.

| ID | Risco | Impacto | Probabilidade | Mitigacao | Status |
|---|---|---:|---:|---|---|
| R-001 | Misturar gameplay, banco, deploy, IA e UI no mesmo PR | Alto | Media | PR pequeno por escopo e WBS | Aberto |
| R-002 | Expor `service_role`, chave admin ou segredo privado no frontend | Critico | Baixa | Usar somente anon/public key e revisar diffs | Aberto |
| R-003 | RLS incorreto permitir acesso cruzado | Critico | Media | Policies por `auth.uid()` e testes futuros de RLS | Aberto |
| R-004 | Prototipo virar codigo final sem refatoracao | Alto | Media | Separar core, services e UI; registrar divida | Em mitigacao |
| R-005 | Deploy funcionar sem banco validado | Medio | Media | Checklist Vercel + Supabase + env | Aberto |
| R-006 | Documentacao prometer recurso nao entregue | Alto | Media | `current-state.md` como fonte documental e matriz de rastreabilidade | Em mitigacao |
| R-007 | Arquivos temporarios entrarem no repo | Medio | Media | Revisao de diff e `.gitignore` | Aberto |
| R-008 | Contrato de catalogo precisava de schema Supabase | Critico | Alta | Fechado no schema versionado e aplicado manualmente em 2026-06-10 | Fechado |
| R-009 | Chave Gemini publica no app ser extraida do bundle | Alto | Alta em producao | Migrar chamada para backend/edge antes de producao | Aberto |
| R-010 | Fotos em `photo_data_url` degradarem performance/custo | Alto | Media | Migrar para Supabase Storage | Aberto |
| R-011 | Build/typecheck passar enquanto gameplay quebra | Alto | Baixa | `npm run test:core` cobre fluxo base; ampliar cenarios avancados | Em mitigacao |
| R-012 | Catalogo compartilhado conflitar com RLS por usuario | Alto | Media | Modelo RLS versionado; falta validar com usuario comum e dono | Em mitigacao |
| R-013 | Logout apagar deck local que ainda nao sincronizou | Alto | Media | Validar sync/merge e UX de aviso antes de producao | Aberto |
| R-014 | Dependencias com vulnerabilidades moderadas em audit | Medio | Alta | Revisar upgrade Expo/Vite em PR proprio; evitar `--force` sem validar SDK | Aberto |

## Regras

- Risco critico deve ter proxima acao antes de evoluir feature nova na mesma area.
- Risco aceito deve ter justificativa documentada.
- Risco fechado deve apontar para PR, commit ou validacao.
