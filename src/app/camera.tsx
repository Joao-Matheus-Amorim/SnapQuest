import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Platform, View, Text, Pressable, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Paths } from "expo-file-system";
import { useCapturedPhotos } from "../hooks/useCapturedPhotos";
import { useAuth } from "../hooks/useAuth";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";

function isRenderableUri(uri: string) {
  return uri.startsWith("file://") || uri.startsWith("http");
}

async function resolveLocalUri(asset: MediaLibrary.Asset, fallback: string): Promise<string | null> {
  const info = await Promise.race([
    MediaLibrary.getAssetInfoAsync(asset),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
  ]);
  const uri = info?.localUri || fallback;
  return isRenderableUri(uri) ? uri : null;
}

async function tryResolveAssetUri(assetId: string | undefined, fallback: string): Promise<{
  assetId?: string;
  filename?: string;
  savedUri: string;
} | null> {
  if (!assetId || Platform.OS === "web") return null;

  try {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) return null;

    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    const localUri = asset?.localUri && isRenderableUri(asset.localUri) ? asset.localUri : null;
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

async function writeReadableGalleryCopy(base64: string | undefined, assetId: string | undefined, filename: string | undefined) {
  if (!base64 || Platform.OS === "web") return null;

  const safeName = filename?.replace(/[^\w.-]+/g, "_") || `${assetId ?? Date.now()}.jpg`;
  const finalName = safeName.endsWith(".jpg") || safeName.endsWith(".jpeg") ? safeName : `${safeName}.jpg`;
  const destination = `${Paths.cache.uri}snapquest-picker-${finalName}`;
  await FileSystemLegacy.writeAsStringAsync(destination, base64, {
    encoding: FileSystemLegacy.EncodingType.Base64,
  });
  return destination;
}

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addCapturedPhoto } = useCapturedPhotos();
  const { canManageCatalog } = useAuth();
  const ownerMode = canManageCatalog;
  const router = useRouter();

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissao necessaria", "Autorize o acesso a camera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    await saveCapture(result.assets[0].uri, result.assets[0].assetId ?? undefined, result.assets[0].fileName ?? undefined, "camera");
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissao necessaria", "Autorize o acesso a galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.9,
      mediaTypes: ["images"],
      base64: Platform.OS !== "web",
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const uri = isRenderableUri(asset.uri) ? asset.uri : null;
    if (!uri) {
      Alert.alert("Foto invalida", "Selecione uma foto da galeria.");
      return;
    }
    await saveCapture(uri, asset.assetId ?? undefined, asset.fileName ?? undefined, "gallery", asset.base64 ?? undefined);
  }

  async function saveCapture(
    capturedUri: string,
    assetId: string | undefined,
    filename: string | undefined,
    source: "camera" | "gallery",
    pickedBase64?: string
  ) {
    setIsSaving(true);
    try {
      let savedUri = capturedUri;

      if (Platform.OS !== "web" && source === "camera") {
        try {
          const mediaResult = await Promise.race([
            (async () => {
              const perm = await MediaLibrary.requestPermissionsAsync();
              if (!perm.granted) return null;
              const asset = await MediaLibrary.createAssetAsync(capturedUri);
              const localUri = await resolveLocalUri(asset, capturedUri);
              if (!localUri) return null;
              return { assetId: asset.id, filename: asset.filename, savedUri: localUri };
            })(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
          ]);
          if (mediaResult) {
            assetId = mediaResult.assetId;
            filename = mediaResult.filename;
            savedUri = mediaResult.savedUri;
          } else if (!isRenderableUri(savedUri)) {
            Alert.alert("Nao foi possivel salvar", "O iOS nao liberou o arquivo. Tente novamente.");
            return;
          }
        } catch {
          // fallback: capturedUri
        }
      }

      if (Platform.OS !== "web" && source === "gallery") {
        const readableCopy = await writeReadableGalleryCopy(pickedBase64, assetId, filename);
        if (readableCopy) {
          savedUri = readableCopy;
        } else {
          const resolvedGalleryAsset = await tryResolveAssetUri(assetId, capturedUri);
          if (resolvedGalleryAsset) {
            assetId = resolvedGalleryAsset.assetId;
            filename = resolvedGalleryAsset.filename;
            savedUri = resolvedGalleryAsset.savedUri;
          }
        }
      }

      await addCapturedPhoto({ uri: savedUri, assetId, filename, source });
      setImageUri(savedUri);
      setTimeout(() => router.replace("/inventory"), 800);
    } catch {
      Alert.alert("Erro ao salvar", "Verifique as permissoes e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Camera</Text>
      <Text style={styles.title}>Nova captura</Text>
      <Text style={styles.subtitle}>
        {ownerMode
          ? "Camera para deck pessoal. Galeria para catalogo base."
          : "Capture uma foto para criar Fighter ou Carta."}
      </Text>

      <Pressable style={styles.button} onPress={pickFromCamera} disabled={isSaving}>
        <Text style={styles.buttonText}>{isSaving ? "Salvando..." : "Tirar foto"}</Text>
      </Pressable>

      {ownerMode && (
        <Pressable style={[styles.button, styles.galleryButton]} onPress={pickFromGallery} disabled={isSaving}>
          <Text style={styles.buttonText}>Galeria para catalogo</Text>
        </Pressable>
      )}

      {imageUri && (
        <View style={styles.successBox}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Text style={styles.success}>Foto capturada. Abrindo inventario...</Text>
        </View>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101623",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingBottom: BOTTOM_NAV_HEIGHT + 16,
    gap: 14,
  },
  kicker: { color: "#14b8a6", fontSize: 13, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#f8fafc", fontSize: 30, fontWeight: "900", textAlign: "center" },
  subtitle: { color: "rgba(248,250,252,.68)", textAlign: "center", fontSize: 14, lineHeight: 20, maxWidth: 320 },
  button: {
    backgroundColor: "#e11d48",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 8,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  galleryButton: { backgroundColor: "#14b8a6" },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  successBox: { alignItems: "center", gap: 10 },
  preview: { width: 180, height: 180, borderRadius: 8, borderWidth: 2, borderColor: "#22c55e" },
  success: { color: "#22c55e", fontWeight: "800", fontSize: 14 },
});
