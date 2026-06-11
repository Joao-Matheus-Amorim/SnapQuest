export const PHOTO_STORAGE_BUCKET: "snapquest-photos";
export const PHOTO_SIGNED_URL_TTL_SECONDS: number;

export function isLocalPhotoSource(uri: string | null | undefined): boolean;
export function normalizeImageExtension(value: string | null | undefined, fallback?: string): string;
export function inferImageExtension(source: string | null | undefined, fallback?: string): string;
export function buildPhotoStoragePath(input: {
  userId?: string | null;
  itemId: string;
  entity: "fighters" | "cards" | string;
  isCatalog: boolean;
  extension?: string;
}): string;
