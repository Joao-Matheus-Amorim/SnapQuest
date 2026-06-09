import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { createEffectCard, type EffectCard } from "../js/core/cards.js";
import { createFighter, type Fighter } from "../js/core/fighters.js";
import type { CapturedPhoto } from "./useCapturedPhotos";

const PLAYER_DECK_KEY = "snapquest-player-deck-v1";

export type PlayerDeck = {
  fighters: Fighter[];
  cards: EffectCard[];
};

const emptyDeck: PlayerDeck = {
  fighters: [],
  cards: [],
};

function isFighter(item: unknown): item is Fighter {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as Fighter).type === "fighter" &&
    typeof (item as Fighter).id === "string" &&
    typeof (item as Fighter).nome === "string"
  );
}

function isEffectCard(item: unknown): item is EffectCard {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as EffectCard).type === "effect_card" &&
    typeof (item as EffectCard).id === "string" &&
    typeof (item as EffectCard).nome_efeito === "string"
  );
}

async function readPlayerDeck(): Promise<PlayerDeck> {
  const value = await SecureStore.getItemAsync(PLAYER_DECK_KEY);

  if (!value) return emptyDeck;

  try {
    const parsed = JSON.parse(value);

    return {
      fighters: Array.isArray(parsed?.fighters) ? parsed.fighters.filter(isFighter) : [],
      cards: Array.isArray(parsed?.cards) ? parsed.cards.filter(isEffectCard) : [],
    };
  } catch {
    return emptyDeck;
  }
}

async function writePlayerDeck(deck: PlayerDeck) {
  await SecureStore.setItemAsync(PLAYER_DECK_KEY, JSON.stringify(deck));
}

function makeNameFromPhoto(prefix: string, photo: CapturedPhoto) {
  const suffix = new Date(photo.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  return `${prefix} ${suffix}`;
}

export function usePlayerDeck() {
  const [deck, setDeck] = useState<PlayerDeck>(emptyDeck);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const storedDeck = await readPlayerDeck();
    setDeck(storedDeck);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addFighterFromPhoto = useCallback(async (photo: CapturedPhoto) => {
    const currentDeck = await readPlayerDeck();
    const fighter = createFighter({
      classKey: "guerreiro",
      name: makeNameFromPhoto("Fighter", photo),
      photo: photo.uri,
    });
    const nextDeck = {
      ...currentDeck,
      fighters: [fighter, ...currentDeck.fighters],
    };

    await writePlayerDeck(nextDeck);
    setDeck(nextDeck);

    return fighter;
  }, []);

  const addCardFromPhoto = useCallback(async (photo: CapturedPhoto) => {
    const currentDeck = await readPlayerDeck();
    const card = createEffectCard({
      categoryKey: "criatura",
      name: makeNameFromPhoto("Carta", photo),
      photo: photo.uri,
    });
    const nextDeck = {
      ...currentDeck,
      cards: [card, ...currentDeck.cards],
    };

    await writePlayerDeck(nextDeck);
    setDeck(nextDeck);

    return card;
  }, []);

  return {
    ...deck,
    isLoading,
    addFighterFromPhoto,
    addCardFromPhoto,
    reload,
  };
}
