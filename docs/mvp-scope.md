# Escopo do MVP

Ultima atualizacao: 2026-06-10.

## Objetivo

Validar se o ciclo central do SnapQuest e divertido:

```txt
foto -> captura bruta -> Fighter/Carta -> inventario -> batalha -> jogar de novo
```

## Incluido no MVP atual

- MVP web preservado.
- App mobile Expo.
- Captura por camera.
- Galeria no modo dono.
- Inventario local.
- Catalogo com fallback seed.
- Supabase Auth.
- Sync inicial com Supabase.
- 4 classes de Fighter.
- 8 categorias de Carta.
- Gemini opcional para melhorar nome/golpe/vacilo.
- Fallback offline sem IA.
- Batalha local passando o celular.
- Fluxo mobile-first.

## Fora do MVP atual

- Multiplayer online.
- Loja.
- Monetizacao.
- Supabase Storage em producao.
- Backend/edge function para Gemini.
- XP/level completo.
- Conquistas completas.
- Diario de aventuras.
- Deck builder avancado.
- MANA global.
- Habilidades especiais completas.
- Publicacao em app stores.

## Criterio de sucesso

- Criar capturas reais.
- Transformar pelo menos 6 Fighters e 6 Cartas.
- Jogar uma partida do comeco ao fim.
- Entender o fluxo sem explicacao longa.
- Ter vontade de jogar outra partida.

## Criterio tecnico minimo

- `npm run check` passa.
- `npx tsc --noEmit` passa.
- `npm run build` passa quando web for afetado.
- `npx expo install --check` passa quando mobile/deps forem afetados.
- Riscos e dividas conhecidos estao documentados.
