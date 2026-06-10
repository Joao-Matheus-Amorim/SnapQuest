# SnapQuest

SnapQuest e um card game mobile-first em validacao, onde fotos reais viram Fighters ou Cartas para batalhas locais entre dois jogadores no mesmo dispositivo.

O repositorio mantem duas frentes:

- MVP web com Vite, HTML/CSS/JavaScript e deploy Vercel.
- App mobile com React Native, Expo Router, Supabase, persistencia local e fluxo de captura -> transformacao -> inventario -> batalha.

## Estado atual

Data de referencia: 2026-06-10.

| Area | Status | Observacao |
|---|---|---|
| MVP web | Implementado | Valida o loop base e preserva a entrada `index.html`. |
| Core de jogo | Implementado | Regras puras em `src/js/core/`, reutilizadas pelo mobile. |
| Mobile Expo | Implementado em MVP | Home, login, camera/galeria, inventario, filtros, exclusao, revelacao e batalha local. |
| Supabase Auth | Implementado no mobile | Login/cadastro com anon key publica. UX ainda nao e final. |
| Supabase DB | Implementado como schema inicial | Tabelas com RLS por usuario; catalogo versionado com `is_catalog` e controle por `can_manage_catalog`. |
| Persistencia local mobile | Implementada | Deck e capturas usam adapter local; logout limpa o deck local. |
| Gemini | Implementado com fallback | IA opcional sob demanda; fallback deterministico quando chave/cota/modelo falha. |
| Fotos | Parcial | Mobile persiste arquivo local comprimido; banco ainda aceita `photo_data_url`. Storage remoto e pendente. |
| Qualidade automatizada | Parcial | CI roda Expo check, TypeScript, checks estaticos e build web. Faltam testes de comportamento. |

## Fluxos principais

```txt
Camera/Galeria
  -> Capturas brutas
  -> Nome sugerido offline
  -> Opcional: Gemini melhora nome/golpe/vacilo
  -> Fighter ou Carta final
  -> Deck local
  -> Sync Supabase quando usuario esta logado
```

```txt
Inventario
  -> Deck pessoal local/cloud
  -> Catalogo cloud ou seed local
  -> Filtros por tipo e raridade
  -> Batalha local se houver minimo de Fighters e Cartas
```

## Estrutura

```txt
src/app/          Telas mobile com Expo Router
src/components/   Componentes visuais mobile
src/hooks/        Estado mobile, auth, inventario, deck, capturas e batalha
src/services/     Sync Supabase e transformacao Gemini
src/lib/          Supabase, storage mobile, fotos, owner e raridade
src/js/core/      Regras puras do jogo, sem DOM e sem Supabase
src/js/services/  Services do MVP web
src/js/ui/        UI web do MVP
src/styles/       CSS do MVP web
supabase/         Schema inicial do banco
scripts/          Checks estaticos do projeto
docs/             Documentacao PMBOK adaptada, arquitetura, riscos e roadmap
```

## Requisitos

- Node.js 22 para alinhar com CI.
- npm.
- Expo Go compativel com Expo SDK 54 para validacao mobile.
- Projeto Supabase com Auth e schema aplicado.
- Chave Gemini opcional para melhoria por IA.

## Ambiente

Copie `.env.example` para `.env` e preencha somente chaves publicas:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_OWNER_EMAIL=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_GEMINI_MODELS=
```

Nunca coloque `service_role`, chave admin, senha de banco ou segredo privado no frontend.

## Comandos

Instalar dependencias:

```bash
npm ci
```

Rodar MVP web:

```bash
npm run dev
```

Build web:

```bash
npm run build
```

Rodar checks estaticos:

```bash
npm run check
```

Validar TypeScript:

```bash
npx tsc --noEmit
```

Validar dependencias Expo:

```bash
npx expo install --check
```

Rodar mobile:

```bash
npm run mobile
```

Rodar mobile web:

```bash
npm run mobile:web
```

## Banco de dados

Execute `supabase/schema.sql` no SQL Editor do Supabase.

O schema cria:

- `snapquest_profiles`
- `snapquest_fighters`
- `snapquest_effect_cards`
- `snapquest_battle_logs`
- RLS em todas as tabelas
- policies por `auth.uid()`
- trigger de `updated_at`

Ponto de atencao atual: o schema de catalogo foi versionado e aplicado manualmente no Supabase em 2026-06-10. Para escrever no catalogo compartilhado, o perfil do usuario dono precisa ter `can_manage_catalog = true`. Essa permissao nao e alteravel pelo frontend.

## Documentacao principal

- [Indice de documentacao](docs/index.md)
- [Plano de gerenciamento do projeto](docs/project-management-plan.md)
- [Matriz de rastreabilidade](docs/requirements-traceability-matrix.md)
- [Plano de qualidade](docs/quality-management-plan.md)
- [Estado atual](docs/current-state.md)
- [Mapa do projeto](docs/project-map.md)
- [Roadmap](docs/roadmap.md)
- [Banco de dados](docs/database.md)
- [Registro de riscos](docs/risk-register.md)
- [Registro de divida tecnica](docs/technical-debt-register.md)
- [Governanca](docs/project-governance.md)

## Governanca

O projeto segue PMBOK adaptado para produto pequeno:

1. Identificar necessidade, risco ou gap.
2. Registrar escopo e fora de escopo.
3. Trabalhar em PR pequeno.
4. Validar com evidencias.
5. Atualizar documentacao, riscos e dividas.
6. Nao declarar pronto aquilo que nao foi validado.

## Definicao de pronto

Uma entrega so pode ser tratada como pronta quando:

- o codigo esta no escopo aprovado;
- `npm run check` passa;
- `npx tsc --noEmit` passa;
- `npm run build` passa quando a mudanca afeta web/build;
- `npx expo install --check` passa quando a mudanca afeta mobile;
- riscos e dividas foram atualizados;
- README/docs refletem o estado real;
- nenhum segredo sensivel foi introduzido.

## Proximas prioridades tecnicas

1. Validar RLS de catalogo com usuario comum e usuario dono.
2. Criar testes automatizados do core de batalha.
3. Migrar fotos para Supabase Storage.
4. Mover chamada Gemini para backend/edge function antes de producao.
5. Implementar efeito real de LCK e SPD na batalha.
