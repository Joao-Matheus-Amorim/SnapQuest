/**
 * Fonte unica de verdade visual do SnapQuest mobile.
 * Paleta "card game" ja consolidada em home/camera/HUD.
 * Nao colocar regra de jogo aqui; apenas linguagem visual e de movimento.
 */
import type { Rarity } from "../lib/rarityConfig";

// Mundo "Arcano Petroleo & Magenta": base petroleo, magenta acao, ciano acento,
// ouro pontual, branco-frio no texto, azul ambiente no glow.
export const COLORS = {
  // Fundos
  bgDeep: "#0a1226",
  bgNav: "#060c1a",
  panel: "#122142",
  panelHero: "#18294f",
  panelGold: "#2a2410",
  panelRed: "#2a0e2a",
  cardSurface: "#0f1b38",
  cardSurfaceDeep: "#0a1326",

  // Marcas
  primary: "#ff3db4", // magenta — acao
  accent: "#34e1ff", // ciano — acento
  glow: "#6c8cff", // azul ambiente
  gold: "#f5c542", // ouro pontual (premium)
  cream: "#eaf2ff", // branco frio (texto)
  red: "#ff4d6d", // alerta/excluir
  rose: "#ff5d8f",
  green: "#22c55e",
  greenSoft: "#86efac",

  // Texto / linhas (use rgba direto quando precisar de opacidade fina)
  textPrimary: "#eaf2ff",
  textMuted: "rgba(234,242,255,.66)",
  hairline: "rgba(234,242,255,.14)",
} as const;

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 16,
  pill: 20,
  round: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** Duracoes em ms. Mantidas curtas para sensacao responsiva. */
export const DURATION = {
  instant: 0,
  fast: 140,
  base: 240,
  slow: 380,
  reveal: 620,
} as const;

/** Configs de mola para withSpring (Reanimated). */
export const SPRING = {
  /** Toque/press: rapido e firme, sem overshoot exagerado. */
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  /** Entrada/assentar de carta: vivo com leve overshoot. */
  settle: { damping: 12, stiffness: 180, mass: 0.8 },
  /** Tilt/parallax acompanhando o dedo: macio e estavel. */
  tilt: { damping: 22, stiffness: 220, mass: 0.7 },
} as const;

/**
 * Intensidade de efeito por raridade.
 * comum = sobrio; lendario = maximo. Consumido por HoloCard/Reveal/Aura.
 * tiltMax em graus; sweepSpeed em ms por ciclo de foil.
 */
export type RarityEffect = {
  foil: boolean;
  tiltMax: number;
  glow: boolean;
  particles: number;
  sweepMs: number;
};

export const RARITY_EFFECT: Record<Rarity, RarityEffect> = {
  comum: { foil: false, tiltMax: 4, glow: false, particles: 0, sweepMs: 0 },
  incomum: { foil: true, tiltMax: 6, glow: true, particles: 0, sweepMs: 3200 },
  raro: { foil: true, tiltMax: 8, glow: true, particles: 6, sweepMs: 2600 },
  épico: { foil: true, tiltMax: 10, glow: true, particles: 12, sweepMs: 2000 },
  lendário: { foil: true, tiltMax: 12, glow: true, particles: 20, sweepMs: 1500 },
};

export function rarityEffect(rarity: Rarity): RarityEffect {
  return RARITY_EFFECT[rarity];
}
