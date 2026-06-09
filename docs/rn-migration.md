# Migracao React Native + Expo

## Status

- [x] Branch `feat/rn-bootstrap` criada
- [x] Bootstrap Expo iniciado localmente
- [x] `npx expo start` abriu Metro e QR Code
- [x] Estrutura `src/app/`, `src/components/`, `src/hooks/` criada
- [x] Tela inicial mobile criada
- [x] Tela de camera esqueleto criada
- [x] Tela de inventario esqueleto criada
- [x] Tela de batalha esqueleto criada
- [x] `src/js/core/` preservado
- [x] `app.json` ajustado para nao apontar para assets do template Expo que nao existem no repo
- [x] Uso depreciado de `ImagePicker.MediaTypeOptions` removido da tela de camera
- [ ] Alinhar dependencias do bootstrap para Expo SDK 54, pois o dispositivo de validacao nao consegue atualizar o Expo Go acima do SDK 54
- [ ] Rodar `npx expo install --check` apos alinhar SDK 54
- [ ] Rodar `npm run check` apos alinhar SDK 54
- [ ] Validar Expo Go em dispositivo fisico com SDK 54
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

## Decisao de compatibilidade do dispositivo

A primeira tentativa usou Expo SDK 56, mas o dispositivo fisico disponivel para validacao so aceita Expo Go SDK 54 e nao permite atualizacao.

Decisao: alinhar o bootstrap para Expo SDK 54 nesta fase, para que o PR possa ser validado no dispositivo real disponivel.

Consequencia: Expo SDK 56 deve virar upgrade futuro em issue/PR separado, depois que houver ambiente compativel ou development build configurado.

## Validação local

Executado e informado como valido antes do bloqueio de dispositivo:

```bash
npx expo install --check
npm run check
```

Tambem foi informado que `npx expo start` abriu Metro e QR Code.

Essas validacoes devem ser repetidas apos o downgrade/alinhamento para SDK 54.

## Validacao pendente em celular

Ao testar no celular, foram observados dois pontos:

```text
Unable to resolve asset "./assets/icon.png" from "icon" in your app.json or app.config.js
Project is incompatible with this version of Expo Go
The project you requested requires a newer version of Expo Go.
```

A referencia quebrada para `./assets/icon.png` foi removida do `app.json` neste PR.

O erro de incompatibilidade restante ocorre porque o projeto estava em Expo SDK 56, enquanto o dispositivo disponivel aceita apenas Expo Go SDK 54.

Para revalidar apos alinhar SDK 54:

```bash
git pull origin feat/rn-bootstrap
npx expo start --go --clear
```
