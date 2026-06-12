import type { EffectCard } from "../js/core/cards.js";
import { GameCard } from "./cards/GameCard";
import { effectCardToCardData } from "../utils/cardAdapters";
import { CARD_HEIGHT, CARD_WIDTH } from "../utils/cardMeta";

export { CARD_HEIGHT, CARD_WIDTH };

export function CardItem({ card, width = CARD_WIDTH }: { card: EffectCard; width?: number; interactive?: boolean }) {
  return <GameCard data={effectCardToCardData(card)} width={width} />;
}
