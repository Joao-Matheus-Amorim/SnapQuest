import { Link } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useInventory } from "../hooks/useInventory";

export default function BattleScreen() {
  const { battleRequirements } = useInventory();

  if (!battleRequirements.canBattle) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Batalha bloqueada</Text>
        <Text style={styles.subtitle}>
          Para a batalha local pai e filho, o core web exige {battleRequirements.minFighters} fighters e {battleRequirements.minCards} cartas totais.
        </Text>

        <View style={styles.requirementsBox}>
          <Text style={styles.requirementText}>
            Fighters: {battleRequirements.fighterCount}/{battleRequirements.minFighters}
          </Text>
          <Text style={styles.requirementText}>
            Cartas: {battleRequirements.cardCount}/{battleRequirements.minCards}
          </Text>
        </View>

        <Link href="/camera" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryText}>Criar Fighter</Text>
          </Pressable>
        </Link>

        <Link href="/inventory" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Ver Inventário</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Batalha pronta</Text>
      <Text style={styles.subtitle}>Inventário seeded atende o requisito do core. A batalha jogável entra no próximo PR.</Text>
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
    textAlign: "center",
  },
  subtitle: {
    color: "#ffffff",
    marginTop: 10,
    textAlign: "center",
    maxWidth: 320,
  },
  requirementsBox: {
    borderColor: "#f5a623",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    marginBottom: 24,
    width: "100%",
    maxWidth: 320,
  },
  requirementText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
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
