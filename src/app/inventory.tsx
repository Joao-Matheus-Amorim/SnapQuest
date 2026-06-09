import { View, Text, StyleSheet } from "react-native";

export default function InventoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🃏 Inventário</Text>
      <Text style={styles.subtitle}>Tela esqueleto. A FlatList entra no próximo PR.</Text>
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
  },
  subtitle: {
    color: "#ffffff",
    marginTop: 10,
    textAlign: "center",
  },
});
