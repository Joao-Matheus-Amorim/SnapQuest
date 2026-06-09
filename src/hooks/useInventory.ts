import { canStartBattle } from "../js/core/battle.js";
import { seedCards } from "../js/core/cards.js";
import { seedFighters } from "../js/core/fighters.js";
import { usePlayerDeck } from "./usePlayerDeck";

export const MIN_FIGHTERS_TO_BATTLE = 6;
export const MIN_CARDS_TO_BATTLE = 6;

const seededFighters = seedFighters();
const seededCards = seedCards();

export function useInventory() {
  const playerDeck = usePlayerDeck();
  const fighters = [...playerDeck.fighters, ...seededFighters];
  const cards = [...playerDeck.cards, ...seededCards];

  return {
    cards,
    fighters,
    playerFighters: playerDeck.fighters,
    playerCards: playerDeck.cards,
    isLoading: playerDeck.isLoading,
    battleRequirements: {
      minFighters: MIN_FIGHTERS_TO_BATTLE,
      minCards: MIN_CARDS_TO_BATTLE,
      fighterCount: fighters.length,
      cardCount: cards.length,
      canBattle: canStartBattle(fighters, cards),
    },
  };
}
