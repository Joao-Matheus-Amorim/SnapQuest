# Linguagem de Design do SnapQuest (Norte de Design)

Data de referencia: 2026-06-11.

Este documento e o **contrato de design** do app mobile. Ele trava as duas ideias
validadas no dispositivo e serve de norte para toda tela nova ou refino. Quem
mexer em UI deve seguir isto. Fonte unica de tokens em codigo: `src/theme/tokens.ts`.

---

## 1. As duas ideias validadas

1. **Mundo Arena (game-feel, nao dashboard).** A experiencia parece um card game
   de arena estilo Clash Royale: profundidade, cena de fundo viva, botoes gordos 3D,
   HUD de jogo, cartas como heroi. Nunca parecer site, painel, CRM ou SaaS.
2. **Paleta Arcano Petroleo & Magenta.** Base petroleo profundo, magenta como acao,
   ciano como acento, ouro pontual premium, branco-frio no texto, azul ambiente no glow.

Validado em dispositivo nas telas Home e Conta/Login em 2026-06-11.

---

## 2. Principios

- **Jogo, nao dashboard.** Sem retangulos chapados em lista. Tudo tem profundidade,
  luz e materia. Se parecer um formulario administrativo, esta errado.
- **Cena com sentido de lugar.** O fundo e uma arena de batalha arcana (portal,
  runa, raios, faiscas), nao uma cor lisa.
- **Tatil.** Toda acao significativa tem feedback haptico e resposta visual (escala,
  afundar do botao, brilho).
- **Vivo, com sobriedade.** Animacao ambiente continua (glow pulsando, runa girando,
  sheen idle), mas sem poluir. Movimento serve a leitura, nao distrai.
- **Acessibilidade primeiro.** "Reduzir movimento" desliga partculas, raios, sheen e
  entradas. Contraste alto. Alvos de toque >= 44px.
- **Performance.** Animacao na thread de UI (Reanimated). Efeitos pesados gated por
  raridade/visibilidade. Sem Skia no runtime enquanto rodarmos em Expo Go.

---

## 3. Paleta (fonte: `src/theme/tokens.ts` -> COLORS)

| Token | Hex | Papel |
|---|---|---|
| `bgDeep` | `#0a1226` | Fundo base (petroleo) |
| `bgNav` | `#060c1a` | Fundo mais escuro / nav |
| `panel` | `#122142` | Painel/cartao |
| `panelHero` | `#18294f` | Painel elevado |
| `cardSurface` | `#0f1b38` | Superficie de carta |
| `primary` | `#ff3db4` | **Magenta — ACAO** (DUELAR, CTA principal) |
| `accent` | `#34e1ff` | **Ciano — acento** (Capturar, conectado, info) |
| `gold` | `#f5c542` | Ouro pontual premium (selos, ticks, Grimorio) |
| `glow` | `#6c8cff` | Azul ambiente (halos, brilho de fundo) |
| `cream` | `#eaf2ff` | Texto primario (branco frio) |
| `green` / `greenSoft` | `#22c55e` / `#86efac` | Estado positivo (pronto, conectado) |
| `red` | `#ff4d6d` | Alerta / excluir |

Regra: **uma base + uma acao (magenta) + um acento (ciano) + ouro como brilho.**
Nao introduzir cores novas saturadas competindo. Verde/vermelho so para estado.

---

## 4. Tipografia

- Pesos: titulos e numeros sempre `900` (impacto de jogo). Labels `800/900` com
  `letterSpacing` 1–5 e MAIUSCULAS para HUD/selo.
- Escala: wordmark ~32, titulo de tela ~28, titulo de botao 16–21, label/legenda 10–13.
- Texto em `cream` (#eaf2ff); secundario em `rgba(234,242,255,.6–.72)`.
- Brilho de texto (wordmark) com `textShadow` magenta para destaque heroico.

---

## 5. Profundidade e iluminacao

- **Botao 3D (`GameButton`):** face com gradiente vertical + gloss no topo + `ledge`
  inferior (bevel) que afunda no toque + halo colorido por variante. Ver
  `src/components/game/GameButton.tsx`.
- **Halo/glow:** `shadowColor` = cor da variante, `shadowRadius` alto, `shadowOpacity`
  ~0.8. Usado em botoes, orbes, selos.
- **Cena (`ArenaBackground`):** glow radial real (SVG), runa magica girando, raios de
  energia, relampagos crepitando, faiscas subindo, vinheta topo/base.
- **Cartas (`HoloCard`):** foil holografico varrendo + tilt 3D opcional por gesto.
- Bordas com leve highlight branco (`rgba(255,255,255,.2–.5)`) para simular luz.

---

## 6. Movimento (fonte: `src/theme/tokens.ts` -> DURATION / SPRING)

- **Duracoes:** `fast 140 / base 240 / slow 380 / reveal 620` ms.
- **Molas:** `press` (firme), `settle` (entrada com overshoot), `tilt` (macio).
- **Entrada de tela:** elementos sobem em cascata (`FadeInDown` com `delay`
  escalonado e `springify`).
- **Idle ambiente:** glow pulsa, runa gira (~38s), sheen varre o botao principal,
  foil varre cartas raras, faiscas sobem.
- **Reduced motion:** tudo acima vira estatico/instantaneo via `useReducedMotion`.

---

## 7. Haptics (fonte: `src/lib/haptics.ts`)

Eventos semanticos: `tap` (toque), `select` (aba/filtro), `success` (acao concluida),
`warning`, `error` (destrutivo), `reveal` (impacto), `legendary` (jackpot).
No-op em web e quando desligado. Nunca lanca.

---

## 8. Componentes do sistema

| Componente | Arquivo | Papel |
|---|---|---|
| `ArenaBackground` | `src/components/game/ArenaBackground.tsx` | Cena de fundo de batalha (toda tela imersiva) |
| `GameButton` | `src/components/game/GameButton.tsx` | Botao gordo 3D, variantes `primary/accent/gold/green/dark` |
| `GemCounter` / orbe | `src/app/index.tsx` (promover p/ shared se reusar) | Medidor com esfera + barra brilhante |
| `HudChip` | `src/app/index.tsx` | Chip de recurso no HUD (nivel, colecao) |
| `HoloCard` | `src/components/motion/HoloCard.tsx` | Foil + tilt das cartas |
| `PressableScale` | `src/components/motion/PressableScale.tsx` | Toque com mola + haptic |
| `CardTemplate` | `src/components/card/CardTemplate.tsx` | Base visual unica das cartas colecionaveis: frame por raridade, foto real, HP, habilidade, stats e raridade |
| `FighterCard` / `CardItem` | `src/components/` | Adaptadores de dados para o `CardTemplate`, sem duplicar layout ou moldura |

---

## 9. Stack tecnico de UI

- **Reanimated 4** (`react-native-worklets/plugin` no `babel.config.cjs`) — animacao
  na thread de UI.
- **expo-linear-gradient** — gradientes (botoes, ceu, foil, orbes).
- **react-native-svg** — glow radial, runa, raios, relampagos.
- **expo-haptics** — feedback tatil.
- **react-native-gesture-handler** — tilt/parallax.
- **@shopify/react-native-skia** — INSTALADO mas **nao usado em runtime**. Reservado
  para um futuro dev build (blend modes, shaders, particulas ricas). Hoje priorizamos
  rodar no **Expo Go**, que nao inclui Skia.

---

## 10. Do & Don't

**Do**
- Fundo sempre com cena/profundidade nas telas de jornada (Home, Login, Captura, Duelo).
- Acao principal em magenta com brilho. Acento/info em ciano. Ouro pontual.
- Botoes gordos 3D com haptic. Entradas animadas. Estado claro (conectado, pronto).
- Vocabulario de jogo (ver secao 12).

**Don't**
- Nao usar painel chapado, lista administrativa, landing page ou cara de SaaS.
- Nao encher de cores saturadas concorrentes. Nao usar a paleta antiga (roxo/azul #1a1a2e, ouro #f5a623).
- Nao animar sem respeitar reduced motion. Nao bloquear scroll com tilt em grids.
- Nao misturar refino de UI com banco/RLS/Storage/Gemini/regra de batalha.

---

## 11. Status por tela

| Tela | Status |
|---|---|
| Home (`index.tsx`) | **Premium validado** (cena, orbes, botoes 3D, entradas) |
| Conta/Login (`login.tsx`) | **Premium validado** (estado logado + form) |
| Camera/Portal (`camera.tsx`) | **Premium aplicado**: portal com video de cena, runa/sigilo, raios por camada, haptics e fluxo de captura limpo |
| Grimorio/Deck (`inventory.tsx`) | **Premium aplicado em primeira passada**: Camara do Grimorio, HUD de prontidao, filtros magicos e cards com `CardTemplate` unico por raridade |
| Reveal (`RevealModal.tsx`) | **Premium cinematografico** (cerimonia full-screen, sigilo, feixes, shockwave, carta 3D, haptics, CTA 3D) |
| Batalha (`battle.tsx`) | **Em refinamento**: arena vertical, mao de cartas, energia, toque/arrasto direto, golpes/vacilos e log recolhivel; precisa de validacao visual em Android real |
| BottomNav (`BottomNav.tsx`) | **Premium aplicado**: HUD inferior com runas, gemas, pedestal, halos e estados ativos |

---

## 12. Vocabulario do jogo

Arena, Portal (captura), Grimorio/Deck (inventario), Duelo (batalha), Forjar
(criar item), Ritual (transformar captura), Mestre do catalogo (admin),
Conectado (logado), Prontidao de duelo (requisito de batalha).

---

## 13. Referencias

- **Game-feel / layout:** Clash Royale (botoes, HUD, sensacao de arena familiar).
- **Paleta / foil premium:** Marvel Snap (escuro sofisticado, holografico).

Decisao relacionada: `docs/decision-log.md` D-014, D-015. Requisito: REQ-027, REQ-028.
