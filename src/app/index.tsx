import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View, Text, Pressable, StyleSheet } from "react-native";

import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SnapQuest</Text>
      <Text style={styles.subtitle}>Card Game · Foto · Batalha</Text>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Camera")}>
        <Text style={styles.primaryText}>📸 Criar Fighter</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Inventory")}>
        <Text style={styles.secondaryText}>🃏 Ver Inventário</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Battle")}>
        <Text style={styles.secondaryText}>⚔️ Testar Batalha</Text>
      </Pressable>
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
    fontSize: 42,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginBottom: 14,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButton: {
    borderColor: "#f5a623",
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginBottom: 14,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  secondaryText: {
    color: "#f5a623",
    fontSize: 18,
    fontWeight: "700",
  },
});
