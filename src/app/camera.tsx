import { useState } from "react";
import { Link } from "expo-router";
import { Alert, View, Text, Pressable, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useCapturedPhotos } from "../hooks/useCapturedPhotos";

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addCapturedPhoto } = useCapturedPhotos();

  async function pickImage() {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

    if (!cameraPermission.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso à câmera para capturar uma foto real.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });

      if (result.canceled) return;

      setIsSaving(true);

      const capturedUri = result.assets[0].uri;
      const assetId = result.assets[0].assetId ?? undefined;
      const filename = result.assets[0].fileName ?? undefined;

      await addCapturedPhoto({ uri: capturedUri, assetId, filename });
      setImageUri(savedUri);
    } catch {
      Alert.alert("Não foi possível salvar a captura", "Verifique as permissões do Expo Go e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Nova Captura</Text>
      <Text style={styles.subtitle}>
        A foto original fica nas Capturas Brutas. Para jogar, transforme em Fighter ou Carta no Inventário.
      </Text>

      <Pressable style={styles.button} onPress={pickImage} disabled={isSaving}>
        <Text style={styles.buttonText}>{isSaving ? "Salvando..." : "Tirar Foto"}</Text>
      </Pressable>

      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Text style={styles.success}>Foto salva nas Capturas Brutas.</Text>
          <Link href="/inventory" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Transformar no Inventário</Text>
            </Pressable>
          </Link>
        </>
      ) : null}
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
  },
  title: {
    color: "#f5a623",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
  },
  secondaryButton: {
    borderColor: "#f5a623",
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
  },
  secondaryButtonText: {
    color: "#f5a623",
    fontWeight: "800",
    fontSize: 15,
  },
  preview: {
    width: 220,
    height: 220,
    borderRadius: 24,
    marginTop: 28,
  },
  success: {
    color: "#ffffff",
    marginTop: 14,
    textAlign: "center",
  },
});
