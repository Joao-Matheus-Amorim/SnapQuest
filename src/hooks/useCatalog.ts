import { useEffect, useState } from "react";
import { seedFighters } from "../js/core/fighters.js";
import { seedCards } from "../js/core/cards.js";
import { loadCatalog } from "../services/cloudSync";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

export function useCatalog() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [cards, setCards] = useState<EffectCard[]>([]);

  useEffect(() => {
    loadCatalog()
      .then(({ fighters: f, cards: c }) => {
        setFighters(f.length > 0 ? f : seedFighters());
        setCards(c.length > 0 ? c : seedCards());
      })
      .catch(() => {
        setFighters(seedFighters());
        setCards(seedCards());
      });
  }, []);

  return { fighters, cards };
}
