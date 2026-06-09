# Migração React Native + Expo

## Status

- [x] Branch `feat/rn-bootstrap` criada
- [x] Expo SDK 56 iniciado localmente
- [x] `npx expo start` abriu Metro e QR Code
- [x] Estrutura `src/app/`, `src/components/`, `src/hooks/` criada
- [x] Tela inicial mobile criada
- [x] Tela de câmera esqueleto criada
- [x] Tela de inventário esqueleto criada
- [x] Tela de batalha esqueleto criada
- [x] `src/js/core/` preservado
- [x] `npx expo install --check` validado
- [x] `npm run check` validado
- [ ] Validar Expo Go em dispositivo físico
- [ ] Adaptar Supabase para `EXPO_PUBLIC_`
- [ ] Criar persistência mobile com SecureStore/AsyncStorage
- [ ] Criar inventário completo com FlatList
- [ ] Criar `useBattle` usando `src/js/core/battle.js`
- [ ] Integrar foto -> fighter
- [ ] Integrar Gemini
- [ ] Integrar Supabase Storage

## Decisão

O MVP web continua existindo. O bootstrap mobile foi adicionado sem remover `index.html`, `vite.config.js` ou `vercel.json`.

## Validação local

Executado:

```bash
npx expo start
npx expo install --check
npm run check
