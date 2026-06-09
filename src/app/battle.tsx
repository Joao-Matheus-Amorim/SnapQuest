import { View, Text, StyleSheet } from "react-native";

export default function BattleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚔️ Batalha</Text>
      <Text style={styles.subtitle}>Tela esqueleto. O hook useBattle vai reaproveitar src/js/core/battle.js.</Text>
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
