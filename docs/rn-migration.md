# Migracao React Native + Expo

Ultima atualizacao: 2026-06-12.

## Status atual

A migracao para React Native + Expo saiu do bootstrap e chegou a um MVP mobile funcional.

## Entregas concluidas

- Estrutura Expo com `expo-router/entry`.
- `src/app/` com rotas mobile.
- Home com contadores reais.
- Home com status de conta e sync.
- Camera com `expo-image-picker`.
- Galeria para modo admin de catalogo.
- Persistencia de capturas brutas.
- Persistencia de deck local.
- Adapter `mobileStorage.ts` para web/native.
- Inventario com deck, catalogo, filtros e exclusao.
- Transformacao de captura em Fighter/Carta.
- Gemini via edge function com fallback.
- Persistencia de foto final comprimida no aparelho.
- Login/cadastro Supabase com confirmacao de email e guest mode.
- Perfil `snapquest_profiles` garantido no primeiro login.
- Batalha local completa usando o core.
- Testes automatizados do core de batalha via `npm run test:core`.
- TypeScript estrito via `expo/tsconfig.base`.

## Decisoes preservadas

### Expo Router

O projeto usa `expo-router/entry` como entry principal. O `App.tsx` legado foi removido quando a navegacao Expo Router passou a ser a unica fonte ativa do app mobile.

### SDK 54

O projeto esta alinhado ao Expo SDK 54 para compatibilidade com o dispositivo de validacao disponivel na fase inicial.

### MVP web preservado

`index.html`, `vite.config.js` e `vercel.json` continuam no projeto. A migracao mobile nao removeu o MVP web.

## Pendencias mobile

- Validar fluxo completo em dispositivo fisico atualizado.
- `npm run test:rls:catalog` passou com usuario comum e usuario dono no Supabase real em 2026-06-10.
- Validar rollout final de fotos em Supabase Storage no ambiente alvo.
- Validar comportamento real da edge Gemini no fluxo operacional.
- Validar batalha atual em dispositivo fisico com toque/arrasto.

## Comandos uteis

```bash
npm run mobile
```

```bash
npm run mobile:web
```

```bash
npx expo install --check
```

```bash
npx tsc --noEmit
```
