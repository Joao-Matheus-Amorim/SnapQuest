export type Rarity = "comum" | "incomum" | "raro" | "épico" | "lendário";

export const RARITY_ORDER: Rarity[] = ["comum", "incomum", "raro", "épico", "lendário"];

export const RARITY_LABELS: Record<Rarity, string> = {
  comum: "Comum",
  incomum: "Incomum",
  raro: "Raro",
  épico: "Épico",
  lendário: "Lendário",
};

export const RARITY_COLORS: Record<Rarity, string> = {
  comum:    "#5a6a8a",
  incomum:  "#22c55e",
  raro:     "#34e1ff",
  épico:    "#ff3db4",
  lendário: "#f5c542",
};

export const RARITY_BORDER: Record<Rarity, number> = {
  comum: 1.5,
  incomum: 2,
  raro: 2,
  épico: 2.5,
  lendário: 4,
};

export function rarityGlow(rarity: Rarity) {
  const glows: Record<Rarity, object> = {
    comum: {},
    incomum: {
      shadowColor: "#22c55e", shadowOpacity: 0.55,
      shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4,
    },
    raro: {
      shadowColor: "#34e1ff", shadowOpacity: 0.75,
      shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 7,
    },
    épico: {
      shadowColor: "#ff3db4", shadowOpacity: 0.9,
      shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 10,
    },
    lendário: {
      shadowColor: "#f5c542", shadowOpacity: 1,
      shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 14,
    },
  };
  return glows[rarity];
}

export function fighterRarity(bonusIntensidade: number): Rarity {
  if (bonusIntensidade >= 5) return "lendário";
  if (bonusIntensidade >= 4) return "épico";
  if (bonusIntensidade >= 3) return "raro";
  if (bonusIntensidade >= 2) return "incomum";
  return "comum";
}

export function cardRarity(raridade: string): Rarity {
  const s = (raridade ?? "").toLowerCase();
  if (s.includes("lend")) return "lendário";
  if (s.includes("épic") || s.includes("epic")) return "épico";
  if (s.includes("raro") || s.includes("rare")) return "raro";
  if (s.includes("incomum") || s.includes("uncommon")) return "incomum";
  return "comum";
}
