# Migracao React Native + Expo

## Status

- [x] Branch `feat/rn-bootstrap` criada
- [x] Expo SDK 56 iniciado localmente
- [x] `npx expo start` abriu Metro e QR Code
- [x] Estrutura `src/app/`, `src/components/`, `src/hooks/` criada
- [x] Tela inicial mobile criada
- [x] Tela de camera esqueleto criada
- [x] Tela de inventario esqueleto criada
- [x] Tela de batalha esqueleto criada
- [x] `src/js/core/` preservado
- [x] `npx expo install --check` validado
- [x] `npm run check` validado
- [x] `app.json` ajustado para nao apontar para assets do template Expo que nao existem no repo
- [x] Uso depreciado de `ImagePicker.MediaTypeOptions` removido da tela de camera
- [ ] Validar Expo Go em dispositivo fisico com app Expo Go atualizado
- [ ] Adaptar Supabase para `EXPO_PUBLIC_`
- [ ] Criar persistencia mobile com SecureStore/AsyncStorage
- [ ] Criar inventario completo com FlatList
- [ ] Criar `useBattle` usando `src/js/core/battle.js`
- [ ] Integrar foto -> fighter
- [ ] Integrar Gemini
- [ ] Integrar Supabase Storage

## Decisao

O MVP web continua existindo. O bootstrap mobile foi adicionado sem remover `index.html`, `vite.config.js` ou `vercel.json`.

Nesta fase, o app mobile permanece com Expo Router porque o projeto abriu usando `expo-router/entry` e a estrutura `src/app/` ja foi criada. Remover o router agora aumentaria o escopo do PR de bootstrap.

## Validação local

Executado e informado como valido:

```bash
npx expo install --check
npm run check
```

Tambem foi informado que `npx expo start` abriu Metro e QR Code.

## Validacao pendente em celular

Ao testar no celular, foram observados dois pontos:

```text
Unable to resolve asset "./assets/icon.png" from "icon" in your app.json or app.config.js
Project is incompatible with this version of Expo Go
The project you requested requires a newer version of Expo Go.
```

A referencia quebrada para `./assets/icon.png` foi removida do `app.json` neste PR.

O erro de incompatibilidade restante nao e bug do codigo do SnapQuest: o projeto usa Expo SDK 56 e o celular precisa estar com uma versao do Expo Go compativel/atualizada.

Para revalidar:

```bash
git pull origin feat/rn-bootstrap
npx expo start --go --clear
```

No celular, atualizar o Expo Go pela App Store/Play Store antes de escanear o QR Code.
