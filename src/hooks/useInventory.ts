export const MIN_FIGHTERS_TO_BATTLE = 3;
export const MIN_ITEMS_TO_BATTLE = 3;

export function useInventory() {
  const fighters = [];
  const items = [];

  return {
    cards: [],
    fighters,
    items,
    isLoading: false,
    battleRequirements: {
      minFighters: MIN_FIGHTERS_TO_BATTLE,
      minItems: MIN_ITEMS_TO_BATTLE,
      fighterCount: fighters.length,
      itemCount: items.length,
      canBattle:
        fighters.length >= MIN_FIGHTERS_TO_BATTLE &&
        items.length >= MIN_ITEMS_TO_BATTLE,
    },
  };
}
