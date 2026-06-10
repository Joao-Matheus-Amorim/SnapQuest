# Migracao React Native + Expo

Ultima atualizacao: 2026-06-10.

## Status atual

A migracao para React Native + Expo saiu do bootstrap e chegou a um MVP mobile funcional.

## Entregas concluidas

- Estrutura Expo com `expo-router/entry`.
- `src/app/` com rotas mobile.
- Home com contadores reais.
- Camera com `expo-image-picker`.
- Galeria para modo dono.
- Persistencia de capturas brutas.
- Persistencia de deck local.
- Adapter `mobileStorage.ts` para web/native.
- Inventario com deck, catalogo, filtros e exclusao.
- Transformacao de captura em Fighter/Carta.
- Gemini real opcional com fallback.
- Persistencia de foto final comprimida no aparelho.
- Login/cadastro Supabase.
- Batalha local completa usando o core.
- TypeScript estrito via `expo/tsconfig.base`.

## Decisoes preservadas

### Expo Router

O projeto usa `expo-router/entry` como entry principal. `App.tsx` permanece como legado do bootstrap inicial, mas nao e a fonte principal de navegacao.

### SDK 54

O projeto esta alinhado ao Expo SDK 54 para compatibilidade com o dispositivo de validacao disponivel na fase inicial.

### MVP web preservado

`index.html`, `vite.config.js` e `vercel.json` continuam no projeto. A migracao mobile nao removeu o MVP web.

## Pendencias mobile

- Validar fluxo completo em dispositivo fisico atualizado.
- Validar RLS de catalogo no Supabase com usuario comum e usuario dono.
- Migrar fotos para Supabase Storage.
- Criar backend/edge para Gemini antes de producao.
- Adicionar testes automatizados de batalha.
- Remover ou aposentar oficialmente `App.tsx` se nao for mais necessario.

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
