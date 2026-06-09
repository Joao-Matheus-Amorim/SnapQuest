import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const CAPTURED_PHOTOS_KEY = "snapquest-captured-photos-v1";
const LEGACY_SECURE_STORE_KEY = CAPTURED_PHOTOS_KEY;
const MAX_CAPTURED_PHOTOS = 24;

export type CapturedPhoto = {
  id: string;
  uri: string;
  assetId?: string;
  filename?: string;
  createdAt: string;
  source: "camera";
  status: "raw";
};

export type CapturedPhotoInput = {
  uri: string;
  assetId?: string;
  filename?: string;
};

function createPhoto(input: CapturedPhotoInput): CapturedPhoto {
  const createdAt = new Date().toISOString();

  return {
    id: `photo-${Date.now()}`,
    uri: input.uri,
    assetId: input.assetId,
    filename: input.filename,
    createdAt,
    source: "camera",
    status: "raw",
  };
}

function normalizeCapturedPhotos(value: unknown): CapturedPhoto[] {
  if (!Array.isArray(value)) return [];

  return value.filter((photo): photo is CapturedPhoto => {
    return (
      typeof photo?.id === "string" &&
      typeof photo?.uri === "string" &&
      typeof photo?.createdAt === "string" &&
      photo.source === "camera" &&
      photo.status === "raw"
    );
  });
}

async function readLegacySecureStorePhotos(): Promise<CapturedPhoto[]> {
  const value = await SecureStore.getItemAsync(LEGACY_SECURE_STORE_KEY);
  if (!value) return [];

  try {
    return normalizeCapturedPhotos(JSON.parse(value));
  } catch {
    return [];
  }
}

async function migrateLegacySecureStorePhotos() {
  const legacyPhotos = await readLegacySecureStorePhotos();
  if (legacyPhotos.length === 0) return [];

  const next = legacyPhotos.slice(0, MAX_CAPTURED_PHOTOS);
  await AsyncStorage.setItem(CAPTURED_PHOTOS_KEY, JSON.stringify(next));
  await SecureStore.deleteItemAsync(LEGACY_SECURE_STORE_KEY);

  return next;
}

async function readCapturedPhotos(): Promise<CapturedPhoto[]> {
  const value = await AsyncStorage.getItem(CAPTURED_PHOTOS_KEY);

  if (!value) {
    return migrateLegacySecureStorePhotos();
  }

  try {
    return normalizeCapturedPhotos(JSON.parse(value));
  } catch {
    return [];
  }
}

async function writeCapturedPhotos(photos: CapturedPhoto[]) {
  await AsyncStorage.setItem(
    CAPTURED_PHOTOS_KEY,
    JSON.stringify(photos.slice(0, MAX_CAPTURED_PHOTOS))
  );
}

export function useCapturedPhotos() {
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const photos = await readCapturedPhotos();
    setCapturedPhotos(photos);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addCapturedPhoto = useCallback(async (input: CapturedPhotoInput) => {
    const existing = await readCapturedPhotos();
    const photo = createPhoto(input);
    const next = [photo, ...existing].slice(0, MAX_CAPTURED_PHOTOS);

    await writeCapturedPhotos(next);
    setCapturedPhotos(next);

    return photo;
  }, []);

  return {
    capturedPhotos,
    isLoading,
    addCapturedPhoto,
    reload,
  };
}
