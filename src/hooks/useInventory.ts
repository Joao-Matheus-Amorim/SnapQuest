import { canStartBattle } from "../js/core/battle.js";
import { seedCards } from "../js/core/cards.js";
import { seedFighters } from "../js/core/fighters.js";

export const MIN_FIGHTERS_TO_BATTLE = 6;
export const MIN_CARDS_TO_BATTLE = 6;

const seededFighters = seedFighters();
const seededCards = seedCards();

export function useInventory() {
  const fighters = seededFighters;
  const cards = seededCards;

  return {
    cards,
    fighters,
    isLoading: false,
    battleRequirements: {
      minFighters: MIN_FIGHTERS_TO_BATTLE,
      minCards: MIN_CARDS_TO_BATTLE,
      fighterCount: fighters.length,
      cardCount: cards.length,
      canBattle: canStartBattle(fighters, cards),
    },
  };
}
