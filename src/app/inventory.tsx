import { ScrollView, Text, StyleSheet } from "react-native";

export default function InventoryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inventário</Text>
      <Text style={styles.subtitle}>Fluxo de transformação em implementação.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#1a1a2e", padding: 24, paddingBottom: 40 },
  title: { color: "#f5a623", fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: 12 },
  subtitle: { color: "#ffffff", marginTop: 10, textAlign: "center", marginBottom: 18 },
});
