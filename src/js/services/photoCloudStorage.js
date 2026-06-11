import {
  PHOTO_SIGNED_URL_TTL_SECONDS,
  PHOTO_STORAGE_BUCKET,
  buildPhotoStoragePath,
  inferImageExtension,
  isLocalPhotoSource,
} from '../core/photoPaths.js';

const CONTENT_TYPE_BY_EXTENSION = {
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function inferContentType(uri) {
  const extension = inferImageExtension(uri);
  return CONTENT_TYPE_BY_EXTENSION[extension] || 'image/jpeg';
}

async function readPhotoArrayBuffer(uri) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not read browser photo source: ${response.status}`);
  return response.arrayBuffer();
}

export async function uploadPhotoToCloud(client, {
  uri,
  itemId,
  entity,
  userId,
  isCatalog,
  existingPath = null,
}) {
  if (!uri) return { path: existingPath, uploaded: false };
  if (!isLocalPhotoSource(uri)) return { path: existingPath, uploaded: false };

  const extension = inferImageExtension(uri);
  const contentType = inferContentType(uri);
  const path = buildPhotoStoragePath({ userId, itemId, entity, isCatalog, extension });
  const body = await readPhotoArrayBuffer(uri);

  const { error } = await client.storage.from(PHOTO_STORAGE_BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  });

  if (error) throw error;
  return { path, uploaded: true };
}

export async function resolvePhotoUrls(client, paths) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const urls = new Map();

  if (!uniquePaths.length) return urls;

  const { data, error } = await client
    .storage
    .from(PHOTO_STORAGE_BUCKET)
    .createSignedUrls(uniquePaths, PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error) throw error;

  for (const entry of data || []) {
    if (entry.path && entry.signedUrl) {
      urls.set(entry.path, entry.signedUrl);
    }
  }

  return urls;
}

export async function deletePhotoFromCloud(client, path) {
  if (!path) return;
  const { error } = await client.storage.from(PHOTO_STORAGE_BUCKET).remove([path]);
  if (error) throw error;
}
