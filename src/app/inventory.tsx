import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useInventory } from "../hooks/useInventory";

export default function InventoryScreen() {
  const { fighters, cards, battleRequirements } = useInventory();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inventário</Text>
      <Text style={styles.subtitle}>
        Seed local reaproveitando o core web. Persistência mobile entra em PR próprio.
      </Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          Fighters: {battleRequirements.fighterCount}/{battleRequirements.minFighters}
        </Text>
        <Text style={styles.summaryText}>
          Cartas: {battleRequirements.cardCount}/{battleRequirements.minCards}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Fighters</Text>
      {fighters.map((fighter) => (
        <View key={fighter.id} style={styles.card}>
          <Text style={styles.cardTitle}>{fighter.icon} {fighter.nome}</Text>
          <Text style={styles.cardText}>{fighter.classe}</Text>
          <Text style={styles.cardText}>
            HP {fighter.hp} · ATK {fighter.atk} · DEF {fighter.def} · LCK {fighter.lck} · SPD {fighter.spd}
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Cartas</Text>
      {cards.map((card) => (
        <View key={card.id} style={styles.card}>
          <Text style={styles.cardTitle}>{card.icon} {card.nome_efeito}</Text>
          <Text style={styles.cardText}>{card.categoria} · {card.raridade}</Text>
          <Text style={styles.cardText}>
            {card.polaridade === "DEBUFF" ? "-" : "+"}{card.intensidade} {card.atributo}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a2e",
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: "#f5a623",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    color: "#ffffff",
    marginTop: 10,
    textAlign: "center",
    marginBottom: 18,
  },
  summaryBox: {
    borderColor: "#f5a623",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  },
  summaryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    color: "#f5a623",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#16213e",
    borderColor: "rgba(245,166,35,.35)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#f5a623",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardText: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 2,
  },
});
