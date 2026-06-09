import { useState } from "react";
import { Alert, View, Text, Pressable, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useCapturedPhotos } from "../hooks/useCapturedPhotos";

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addCapturedPhoto } = useCapturedPhotos();

  async function pickImage() {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();

    if (!cameraPermission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Autorize o acesso à câmera para capturar uma foto real."
      );
      return;
    }

    const mediaPermission = await MediaLibrary.requestPermissionsAsync();

    if (!mediaPermission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Autorize o acesso às fotos para manter a imagem capturada disponível localmente."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled) return;

      setIsSaving(true);

      const capturedUri = result.assets[0].uri;
      const asset = await MediaLibrary.createAssetAsync(capturedUri);
      const savedUri = asset.uri || capturedUri;

      await addCapturedPhoto({
        uri: savedUri,
        assetId: asset.id,
        filename: asset.filename,
      });

      setImageUri(savedUri);
    } catch {
      Alert.alert(
        "Não foi possível salvar a foto",
        "Verifique as permissões do Expo Go nos ajustes do celular e tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova foto</Text>
      <Text style={styles.subtitle}>
        Capture uma foto real. Ela fica salva como foto bruta e ainda não vira Fighter nem carta.
      </Text>

      <Pressable style={styles.button} onPress={pickImage} disabled={isSaving}>
        <Text style={styles.buttonText}>{isSaving ? "Salvando..." : "Tirar Foto"}</Text>
      </Pressable>

      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Text style={styles.success}>Foto bruta salva localmente.</Text>
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
