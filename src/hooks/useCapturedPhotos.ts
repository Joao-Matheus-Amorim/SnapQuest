import { useCallback, useEffect, useState } from "react";
import { getStorageItem, setStorageItem } from "../lib/mobileStorage";

const CAPTURED_PHOTOS_KEY = "snapquest-captured-photos-v1";
const MAX_CAPTURED_PHOTOS = 24;

export type CapturedPhoto = {
  id: string;
  uri: string;
  assetId?: string;
  filename?: string;
  createdAt: string;
  source: "camera" | "gallery";
  status: "raw";
};

export type CapturedPhotoInput = {
  uri: string;
  assetId?: string;
  filename?: string;
  source?: "camera" | "gallery";
};

type CapturedPhotosListener = (photos: CapturedPhoto[]) => void;
const capturedPhotosListeners = new Set<CapturedPhotosListener>();

function emitCapturedPhotos(photos: CapturedPhoto[]) {
  capturedPhotosListeners.forEach((listener) => listener(photos));
}

function createPhoto(input: CapturedPhotoInput): CapturedPhoto {
  const createdAt = new Date().toISOString();

  return {
    id: `photo-${Date.now()}`,
    uri: input.uri,
    assetId: input.assetId,
    filename: input.filename,
    createdAt,
    source: input.source ?? "camera",
    status: "raw",
  };
}

async function readCapturedPhotos(): Promise<CapturedPhoto[]> {
  const value = await getStorageItem(CAPTURED_PHOTOS_KEY);

  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((photo): photo is CapturedPhoto => {
      return (
        typeof photo?.id === "string" &&
        typeof photo?.uri === "string" &&
        photo.source === "camera" &&
        photo.status === "raw"
      );
    });
  } catch {
    return [];
  }
}

async function writeCapturedPhotos(photos: CapturedPhoto[]) {
  const next = photos.slice(0, MAX_CAPTURED_PHOTOS);
  await setStorageItem(CAPTURED_PHOTOS_KEY, JSON.stringify(next));
  emitCapturedPhotos(next);
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
    capturedPhotosListeners.add(setCapturedPhotos);
    void reload();

    return () => {
      capturedPhotosListeners.delete(setCapturedPhotos);
    };
  }, [reload]);

  const addCapturedPhoto = useCallback(async (input: CapturedPhotoInput) => {
    const existing = await readCapturedPhotos();
    const photo = createPhoto(input);
    const next = [photo, ...existing];

    await writeCapturedPhotos(next);

    return photo;
  }, []);

  const removeCapturedPhoto = useCallback(async (photoId: string) => {
    const existing = await readCapturedPhotos();
    const next = existing.filter((photo) => photo.id !== photoId);

    await writeCapturedPhotos(next);
  }, []);

  return {
    capturedPhotos,
    isLoading,
    addCapturedPhoto,
    removeCapturedPhoto,
    reload,
  };
}
