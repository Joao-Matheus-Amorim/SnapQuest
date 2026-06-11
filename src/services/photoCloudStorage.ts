import { Platform } from "react-native";
import { File } from "expo-file-system";
import { supabase } from "../lib/supabase";
import {
  PHOTO_SIGNED_URL_TTL_SECONDS,
  PHOTO_STORAGE_BUCKET,
  buildPhotoStoragePath,
  inferImageExtension,
  isLocalPhotoSource,
} from "../js/core/photoPaths.js";

type PhotoEntity = "fighters" | "cards";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function inferContentType(uri: string) {
  const extension = inferImageExtension(uri);
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? "image/jpeg";
}

async function readPhotoArrayBuffer(uri: string): Promise<ArrayBuffer> {
  // fetch() handles file:// URIs in RN and throws catchable JS errors on permission
  // failures — more stable than expo-file-system File.arrayBuffer() which can
  // trigger unrecoverable native crashes when reading inaccessible DCIM paths.
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not read photo: ${uri} status=${response.status}`);
  return response.arrayBuffer();
}

export async function uploadPhotoToCloud(input: {
  uri: string | null | undefined;
  itemId: string;
  entity: PhotoEntity;
  userId: string;
  isCatalog: boolean;
  existingPath?: string | null;
}) {
  const { uri, itemId, entity, userId, isCatalog, existingPath = null } = input;

  if (!uri) {
    return { path: existingPath, uploaded: false };
  }

  if (!isLocalPhotoSource(uri)) {
    return { path: existingPath, uploaded: false };
  }

  const extension = inferImageExtension(uri);
  const contentType = inferContentType(uri);
  const path = buildPhotoStoragePath({ userId, itemId, entity, isCatalog, extension });
  const body = await readPhotoArrayBuffer(uri);

  const { error } = await supabase.storage.from(PHOTO_STORAGE_BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  });

  if (error) throw error;

  return { path, uploaded: true };
}

export async function resolvePhotoUrls(paths: Array<string | null | undefined>) {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const urls = new Map<string, string>();

  if (!uniquePaths.length) return urls;

  const { data, error } = await supabase
    .storage
    .from(PHOTO_STORAGE_BUCKET)
    .createSignedUrls(uniquePaths, PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error) throw error;

  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) {
      urls.set(entry.path, entry.signedUrl);
    }
  }

  return urls;
}

export async function deletePhotoFromCloud(path: string | null | undefined) {
  if (!path) return;

  const { error } = await supabase.storage.from(PHOTO_STORAGE_BUCKET).remove([path]);
  if (error) throw error;
}
