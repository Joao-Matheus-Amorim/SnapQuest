import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Platform, View, Text, Pressable, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useCapturedPhotos } from "../hooks/useCapturedPhotos";
import { useAuth } from "../hooks/useAuth";
import { isOwner } from "../lib/ownerConfig";
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

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addCapturedPhoto } = useCapturedPhotos();
  const { user } = useAuth();
  const ownerMode = isOwner(user?.email);
  const router = useRouter();

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    await saveCapture(result.assets[0].uri, result.assets[0].assetId ?? undefined, result.assets[0].fileName ?? undefined, "camera");
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, mediaTypes: ["images"] });
    if (result.canceled) return;
    const asset = result.assets[0];
    const uri = isRenderableUri(asset.uri) ? asset.uri : null;
    if (!uri) {
      Alert.alert("Foto inválida", "Selecione uma foto da galeria.");
      return;
    }
    await saveCapture(uri, asset.assetId ?? undefined, asset.fileName ?? undefined, "gallery");
  }

  async function saveCapture(capturedUri: string, assetId: string | undefined, filename: string | undefined, source: "camera" | "gallery") {
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
            Alert.alert("Não foi possível salvar", "O iOS não liberou o arquivo. Tente novamente.");
            return;
          }
        } catch {
          // fallback: capturedUri
        }
      }

      await addCapturedPhoto({ uri: savedUri, assetId, filename, source });
      setImageUri(savedUri);
      setTimeout(() => router.replace("/inventory"), 800);
    } catch {
      Alert.alert("Erro ao salvar", "Verifique as permissões e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Nova Captura</Text>
      <Text style={styles.subtitle}>
        {ownerMode
          ? "Modo dono: câmera → deck pessoal · galeria → catálogo base."
          : "Tire a foto e transforme em Fighter ou Carta no Inventário."}
      </Text>

      <Pressable style={styles.button} onPress={pickFromCamera} disabled={isSaving}>
        <Text style={styles.buttonText}>{isSaving ? "Salvando..." : "📷 Tirar Foto"}</Text>
      </Pressable>

      {ownerMode && (
        <Pressable style={[styles.button, styles.galleryButton]} onPress={pickFromGallery} disabled={isSaving}>
          <Text style={styles.buttonText}>🖼️ Galeria (Catálogo)</Text>
        </Pressable>
      )}

      {imageUri && (
        <View style={styles.successBox}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Text style={styles.success}>✓ Foto capturada! Redirecionando...</Text>
        </View>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingBottom: BOTTOM_NAV_HEIGHT + 16,
    gap: 14,
  },
  title: { color: "#f5a623", fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "rgba(255,255,255,.65)", textAlign: "center", fontSize: 14 },
  button: {
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  galleryButton: { backgroundColor: "#8e44ad" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  successBox: { alignItems: "center", gap: 10 },
  preview: { width: 180, height: 180, borderRadius: 20, borderWidth: 2, borderColor: "#4caf50" },
  success: { color: "#4caf50", fontWeight: "700", fontSize: 14 },
});
