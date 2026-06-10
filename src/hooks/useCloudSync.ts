import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { loadCloudDeck } from "../services/cloudSync";
import { mergeDeckFromCloud } from "./usePlayerDeck";

export function useCloudSync() {
  const { user } = useAuth();
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Deslogou: reseta pra que um novo login (mesmo a mesma conta) re-sincronize.
      lastUserId.current = null;
      return;
    }
    if (user.id === lastUserId.current) return;
    lastUserId.current = user.id;

    loadCloudDeck(user.id)
      .then(({ fighters, cards }) => mergeDeckFromCloud(fighters, cards))
      .catch(() => {});
  }, [user]);
}
