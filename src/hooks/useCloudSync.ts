import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "./useAuth";
import { loadCloudDeck } from "../services/cloudSync";
import { mergeDeckFromCloud } from "./usePlayerDeck";

type CloudSyncStatus = "idle" | "syncing" | "synced" | "error";

type CloudSyncSnapshot = {
  status: CloudSyncStatus;
  message: string;
  lastSyncedAt: number | null;
};

const cloudSyncListeners = new Set<(snapshot: CloudSyncSnapshot) => void>();

let cloudSyncSnapshot: CloudSyncSnapshot = {
  status: "idle",
  message: "Deck local ativo.",
  lastSyncedAt: null,
};

let inFlightUserId: string | null = null;
let inFlightPromise: Promise<void> | null = null;

function emitCloudSync(snapshot: CloudSyncSnapshot) {
  cloudSyncSnapshot = snapshot;
  cloudSyncListeners.forEach((listener) => listener(snapshot));
}

async function runCloudSync(user: User) {
  if (inFlightUserId === user.id && inFlightPromise) {
    return inFlightPromise;
  }

  emitCloudSync({
    status: "syncing",
    message: "Sincronizando deck da nuvem...",
    lastSyncedAt: cloudSyncSnapshot.lastSyncedAt,
  });

  inFlightUserId = user.id;
  inFlightPromise = loadCloudDeck(user.id)
    .then(async ({ fighters, cards }) => {
      await mergeDeckFromCloud(fighters, cards);
      emitCloudSync({
        status: "synced",
        message: "Deck sincronizado com a nuvem.",
        lastSyncedAt: Date.now(),
      });
    })
    .catch(() => {
      emitCloudSync({
        status: "error",
        message: "Nao consegui sincronizar agora. O deck local continua ativo.",
        lastSyncedAt: cloudSyncSnapshot.lastSyncedAt,
      });
    })
    .finally(() => {
      inFlightUserId = null;
      inFlightPromise = null;
    });

  return inFlightPromise;
}

export function useCloudSync() {
  const { user } = useAuth();
  const lastUserId = useRef<string | null>(null);
  const [snapshot, setSnapshot] = useState<CloudSyncSnapshot>(cloudSyncSnapshot);

  useEffect(() => {
    cloudSyncListeners.add(setSnapshot);
    return () => {
      cloudSyncListeners.delete(setSnapshot);
    };
  }, []);

  const retry = useCallback(async () => {
    if (!user) return;
    await runCloudSync(user);
  }, [user]);

  useEffect(() => {
    if (!user) {
      lastUserId.current = null;
      emitCloudSync({
        status: "idle",
        message: "Deck local ativo.",
        lastSyncedAt: null,
      });
      return;
    }

    if (user.id === lastUserId.current) return;
    lastUserId.current = user.id;

    void runCloudSync(user);
  }, [user]);

  return {
    ...snapshot,
    retry,
  };
}
