import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Paths } from "expo-file-system";

export type ResolvedGalleryAsset = {
  assetId?: string;
  filename?: string;
  savedUri: string;
};

export function isRenderableCaptureUri(uri: string) {
  return uri.startsWith("file://") || uri.startsWith("http");
}

export async function tryResolveGalleryAssetUri(
  assetId: string | undefined,
  fallback: string
): Promise<ResolvedGalleryAsset | null> {
  if (!assetId || Platform.OS === "web") return null;

  try {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) return null;

    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    const localUri = asset?.localUri && isRenderableCaptureUri(asset.localUri) ? asset.localUri : null;
    if (!localUri) return null;

    return {
      assetId,
      filename: asset.filename,
      savedUri: localUri,
    };
  } catch {
    return null;
  }
}

export async function writeReadableGalleryCopy(base64: string | undefined, assetId: string | undefined, filename: string | undefined) {
  if (!base64 || Platform.OS === "web") return null;

  const safeName = filename?.replace(/[^\w.-]+/g, "_") || `${assetId ?? Date.now()}.jpg`;
  const finalName = safeName.endsWith(".jpg") || safeName.endsWith(".jpeg") ? safeName : `${safeName}.jpg`;
  const destination = `${Paths.cache.uri}snapquest-picker-${finalName}`;
  await FileSystemLegacy.writeAsStringAsync(destination, base64, {
    encoding: FileSystemLegacy.EncodingType.Base64,
  });
  return destination;
}
