import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function pickImage() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Novo Fighter</Text>
      <Text style={styles.subtitle}>Capture uma foto para virar personagem no futuro.</Text>

      <Pressable style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Tirar Foto</Text>
      </Pressable>

      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Text style={styles.success}>Foto capturada! ✅</Text>
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
  },
});
