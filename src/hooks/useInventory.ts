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
  const playerBattleReady = canStartBattle(playerDeck.fighters, playerDeck.cards);
  const quickBattleReady = canStartBattle(fighters, cards);

  return {
    cards,
    fighters,
    playerFighters: playerDeck.fighters,
    playerCards: playerDeck.cards,
    catalogFighters: catalog.fighters,
    catalogCards: catalog.cards,
    isLoading: playerDeck.isLoading,
    reload: playerDeck.reload,
    reloadCatalog: catalog.reload,
    removeFighter: playerDeck.removeFighter,
    removeCard: playerDeck.removeCard,
    battleRequirements: {
      minFighters: MIN_FIGHTERS_TO_BATTLE,
      minCards: MIN_CARDS_TO_BATTLE,
      fighterCount: fighters.length,
      cardCount: cards.length,
      playerFighterCount: playerDeck.fighters.length,
      playerCardCount: playerDeck.cards.length,
      catalogFighterCount: catalog.fighters.length,
      catalogCardCount: catalog.cards.length,
      canBattle: quickBattleReady,
      canBattleWithPlayerDeck: playerBattleReady,
    },
  };
}
