import { canStartBattle } from "../js/core/battle.js";
import { usePlayerDeck } from "./usePlayerDeck";
import { useCatalog } from "./useCatalog";

export const MIN_FIGHTERS_TO_BATTLE = 6;
export const MIN_CARDS_TO_BATTLE = 6;

export function useInventory() {
  const playerDeck = usePlayerDeck();
  const catalog = useCatalog();

  const fighters = [...playerDeck.fighters, ...catalog.fighters];
  const cards = [...playerDeck.cards, ...catalog.cards];

  return {
    cards,
    fighters,
    playerFighters: playerDeck.fighters,
    playerCards: playerDeck.cards,
    isLoading: playerDeck.isLoading,
    reload: playerDeck.reload,
    battleRequirements: {
      minFighters: MIN_FIGHTERS_TO_BATTLE,
      minCards: MIN_CARDS_TO_BATTLE,
      fighterCount: fighters.length,
      cardCount: cards.length,
      canBattle: canStartBattle(fighters, cards),
    },
  };
}
