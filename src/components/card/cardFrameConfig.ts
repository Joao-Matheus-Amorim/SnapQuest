import type { ImageSourcePropType } from "react-native";
import type { Rarity } from "../../lib/rarityConfig";
import { COLORS } from "../../theme/tokens";

export const CARD_WIDTH = 160;
export const CARD_ASPECT = 1.6;
export const CARD_HEIGHT = Math.round(CARD_WIDTH * CARD_ASPECT);
export const FRAME_INSET = 0.035;

const FRAME_COMMON = require("../../../assets/card-frames/common.png");
const FRAME_UNCOMMON = require("../../../assets/card-frames/uncommon.png");
const FRAME_RARE = require("../../../assets/card-frames/rare.png");
const FRAME_EPIC = require("../../../assets/card-frames/epic.png");
const FRAME_LEGENDARY = require("../../../assets/card-frames/legendary.png");

export const CLASS_COLORS: Record<string, string> = {
  guerreiro: "#ff4d6d",
  mago: "#ff3db4",
  arqueiro: "#22c55e",
  curandeiro: "#34e1ff",
  paladino: "#f5c542",
  invocador: "#ff8a3d",
  sombrio: "#8ea4c8",
  elemental: "#34e1ff",
};

export const CATEGORY_COLORS: Record<string, string> = {
  natural: "#22c55e",
  consumivel: "#f5c542",
  ferramenta: "#8ea4c8",
  criatura: "#ff8a3d",
  vestimenta: "#ff3db4",
  fogo: "#ff4d6d",
  liquido: "#34e1ff",
  conhecimento: "#6c8cff",
};

export function classColor(key?: string | null) {
  return CLASS_COLORS[key ?? ""] ?? COLORS.primary;
}

export function categoryColor(key?: string | null) {
  return CATEGORY_COLORS[key ?? ""] ?? COLORS.accent;
}

export function cardFrameForRarity(rarity: Rarity): ImageSourcePropType {
  if (rarity === "comum") return FRAME_COMMON;
  if (rarity === "incomum") return FRAME_UNCOMMON;
  if (rarity === "raro") return FRAME_RARE;
  if (rarity.includes("pico")) return FRAME_EPIC;
  return FRAME_LEGENDARY;
}

export function isLegendaryRarity(rarity: Rarity) {
  return rarity.includes("lend");
}

export function isRenderableCardPhoto(uri?: string | null) {
  if (!uri) return false;
  if (uri.includes("/var/mobile/Media/") || uri.includes("/DCIM/")) return false;
  return uri.startsWith("file://") || uri.startsWith("http") || uri.startsWith("data:") || uri.startsWith("content://");
}
