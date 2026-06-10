import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { loadCloudDeck } from "../services/cloudSync";
import { mergeDeckFromCloud } from "./usePlayerDeck";

export function useCloudSync() {
  const { user } = useAuth();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || user.id === lastUserId.current) return;
    lastUserId.current = user.id;

    loadCloudDeck(user.id)
      .then(({ fighters, cards }) => mergeDeckFromCloud(fighters, cards))
      .catch(() => {});
  }, [user]);
}
