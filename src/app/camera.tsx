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
      <View style={styles.portal}>
        <Text style={styles.realm}>PORTAL DE CAPTURA</Text>
        <Text style={styles.title}>Transforme uma foto em poder de batalha.</Text>
        <Text style={styles.subtitle}>
          {ownerMode
            ? "Camera cria seu deck. Galeria alimenta o catalogo base."
            : "Capture uma foto e escolha Fighter ou Carta no grimorio."}
        </Text>

        <View style={styles.captureFrame}>
          <View style={styles.frameTop}>
            <Text style={styles.frameCode}>SNAP</Text>
            <Text style={styles.frameCode}>QUEST</Text>
          </View>
          <Text style={styles.frameTitle}>FOTO</Text>
          <Text style={styles.frameArrow}>FIGHTER / CARTA</Text>
          <View style={styles.frameBottom}>
            <Text style={styles.frameHint}>analise</Text>
            <Text style={styles.frameHint}>raridade</Text>
            <Text style={styles.frameHint}>duelo</Text>
          </View>
        </View>

        <Pressable style={styles.button} onPress={pickFromCamera} disabled={isSaving}>
          <Text style={styles.buttonText}>{isSaving ? "Canalizando..." : "Abrir camera"}</Text>
        </Pressable>

        {ownerMode && (
          <Pressable style={[styles.button, styles.galleryButton]} onPress={pickFromGallery} disabled={isSaving}>
            <Text style={styles.buttonText}>Importar para catalogo</Text>
          </Pressable>
        )}
      </View>

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
    backgroundColor: "#120916",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    paddingBottom: BOTTOM_NAV_HEIGHT + 16,
  },
  portal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(247,201,72,.72)",
    backgroundColor: "#25112f",
    padding: 16,
    shadowColor: "#f43f5e",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  realm: { color: "#f7c948", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, textAlign: "center" },
  title: { color: "#fff7d6", fontSize: 27, lineHeight: 32, fontWeight: "900", textAlign: "center", marginTop: 12 },
  subtitle: { color: "rgba(255,247,214,.7)", textAlign: "center", fontSize: 14, lineHeight: 20, marginTop: 8 },
  captureFrame: {
    minHeight: 230,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.24)",
    backgroundColor: "#120916",
    marginTop: 18,
    marginBottom: 14,
    padding: 14,
    justifyContent: "space-between",
  },
  frameTop: { flexDirection: "row", justifyContent: "space-between" },
  frameCode: { color: "rgba(247,201,72,.78)", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  frameTitle: { color: "#ffffff", fontSize: 48, fontWeight: "900", textAlign: "center", letterSpacing: 3 },
  frameArrow: { color: "#f43f5e", fontSize: 13, fontWeight: "900", textAlign: "center", letterSpacing: 1.2 },
  frameBottom: { flexDirection: "row", justifyContent: "center", gap: 8 },
  frameHint: {
    color: "rgba(255,247,214,.7)",
    fontSize: 10,
    fontWeight: "900",
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.16)",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  button: {
    backgroundColor: "#f43f5e",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 8,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    marginTop: 10,
  },
  galleryButton: { backgroundColor: "#2d2110", borderWidth: 1, borderColor: "rgba(247,201,72,.55)" },
  buttonText: { color: "#fff7d6", fontWeight: "900", fontSize: 16 },
  successBox: { alignItems: "center", gap: 10, marginTop: 14 },
  preview: { width: 160, height: 160, borderRadius: 8, borderWidth: 2, borderColor: "#f7c948" },
  success: { color: "#f7c948", fontWeight: "900", fontSize: 14 },
});
