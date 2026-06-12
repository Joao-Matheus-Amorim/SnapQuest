import type { Fighter } from "../js/core/fighters.js";
import { GameCard } from "./cards/GameCard";
import { fighterToCardData } from "../utils/cardAdapters";
import { CARD_HEIGHT, CARD_WIDTH } from "../utils/cardMeta";

export { CARD_HEIGHT, CARD_WIDTH };

export function FighterCard({ fighter, width = CARD_WIDTH }: { fighter: Fighter; width?: number; interactive?: boolean }) {
  return <GameCard data={fighterToCardData(fighter)} width={width} />;
}
