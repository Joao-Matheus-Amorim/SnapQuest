export const PHOTO_STORAGE_BUCKET = 'snapquest-photos';
export const PHOTO_SIGNED_URL_TTL_SECONDS = 60 * 60;

const LOCAL_URI_SCHEMES = ['file:', 'content:', 'blob:', 'data:', 'ph:', 'assets-library:', 'asset:'];
const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function isLocalPhotoSource(uri) {
  if (typeof uri !== 'string' || !uri.trim()) return false;
  return LOCAL_URI_SCHEMES.some((scheme) => uri.startsWith(scheme));
}

export function normalizeImageExtension(value, fallback = 'jpg') {
  const candidate = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');

  if (!candidate) return fallback;
  if (candidate === 'jpeg') return 'jpg';
  if (['jpg', 'png', 'webp', 'gif'].includes(candidate)) return candidate;
  return fallback;
}

export function inferImageExtension(source, fallback = 'jpg') {
  const value = String(source || '').trim().toLowerCase();
  if (!value) return fallback;

  if (value.startsWith('data:')) {
    const mime = value.slice(5).split(';')[0];
    return inferImageExtension(mime, fallback);
  }

  if (value.startsWith('image/')) {
    return normalizeImageExtension(MIME_EXTENSION_MAP[value] || value.split('/').pop(), fallback);
  }

  const clean = value.split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  if (lastDot >= 0 && lastDot < clean.length - 1) {
    return normalizeImageExtension(clean.slice(lastDot + 1), fallback);
  }

  return fallback;
}

export function buildPhotoStoragePath({ userId, itemId, entity, isCatalog, extension = 'jpg' }) {
  const cleanEntity = entity === 'cards' ? 'cards' : 'fighters';
  const cleanExtension = normalizeImageExtension(extension);

  if (!itemId) throw new Error('Storage photo path requires itemId.');

  if (isCatalog) {
    return `catalog/${cleanEntity}/${itemId}.${cleanExtension}`;
  }

  if (!userId) throw new Error('Storage photo path requires userId for personal items.');

  return `users/${userId}/${cleanEntity}/${itemId}.${cleanExtension}`;
}
