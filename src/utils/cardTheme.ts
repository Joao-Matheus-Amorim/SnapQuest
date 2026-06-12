/**
 * Tema visual por raridade — fonte única para template PNG, neon de fundo e foil.
 *
 * A imagem `template` é a verdade visual da moldura. O código nunca redesenha
 * a borda; só usa esta tabela para escolher o PNG, a cor do neon traseiro,
 * o rótulo e se o foil holográfico deve aparecer (épico/lendário).
 *
 * Mapeamento de raridade pt-BR (domínio) → en (assets) em `rarityToCardRarity`.
 */
import type { ImageSourcePropType } from "react-native";
import type { Rarity } from "../lib/rarityConfig";
import type { CardRarity } from "../types/card";

export interface CardRarityTheme {
  label: string;
  template: ImageSourcePropType;
  /** Cor do neon/glow atrás da carta. */
  neonColor: string;
  /** Cor clara do halo externo. */
  glowColor: string;
  /** Foil holográfico ligado (apenas épico/lendário). */
  foil: boolean;
}

export const CARD_RARITY_THEME: Record<CardRarity, CardRarityTheme> = {
  common: {
    label: "COMUM",
    template: require("../../assets/cards/templates/common.png"),
    neonColor: "#AEB7C4",
    glowColor: "#D8DEE8",
    foil: false,
  },
  uncommon: {
    label: "INCOMUM",
    template: require("../../assets/cards/templates/uncommon.png"),
    neonColor: "#3CFF8A",
    glowColor: "#8CFFC0",
    foil: false,
  },
  rare: {
    label: "RARO",
    template: require("../../assets/cards/templates/rare.png"),
    neonColor: "#38C8FF",
    glowColor: "#8BEAFF",
    foil: false,
  },
  epic: {
    label: "ÉPICO",
    template: require("../../assets/cards/templates/epic.png"),
    neonColor: "#B15CFF",
    glowColor: "#E0B5FF",
    foil: true,
  },
  legendary: {
    label: "LENDÁRIO",
    template: require("../../assets/cards/templates/legendary.png"),
    neonColor: "#FFB800",
    glowColor: "#FFE08A",
    foil: true,
  },
};

/** Converte a raridade de domínio (pt-BR) para a chave de template (en). */
export function rarityToCardRarity(rarity: Rarity): CardRarity {
  switch (rarity) {
    case "incomum":
      return "uncommon";
    case "raro":
      return "rare";
    case "épico":
      return "epic";
    case "lendário":
      return "legendary";
    case "comum":
    default:
      return "common";
  }
}

export function cardRarityTheme(rarity: CardRarity): CardRarityTheme {
  return CARD_RARITY_THEME[rarity];
}
