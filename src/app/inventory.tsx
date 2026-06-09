import { Image, ScrollView, View, Text, StyleSheet } from "react-native";
import { useCapturedPhotos } from "../hooks/useCapturedPhotos";
import { useInventory } from "../hooks/useInventory";

export default function InventoryScreen() {
  const { fighters, cards, battleRequirements } = useInventory();
  const { capturedPhotos } = useCapturedPhotos();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inventário</Text>
      <Text style={styles.subtitle}>
        Fighters e cartas vêm do seed local. Fotos brutas ficam separadas e não contam para batalha.
      </Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          Fighters: {battleRequirements.fighterCount}/{battleRequirements.minFighters}
        </Text>
        <Text style={styles.summaryText}>
          Cartas: {battleRequirements.cardCount}/{battleRequirements.minCards}
        </Text>
        <Text style={styles.rawText}>Fotos brutas: {capturedPhotos.length}</Text>
      </View>

      <Text style={styles.sectionTitle}>Fotos brutas capturadas</Text>
      {capturedPhotos.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nenhuma foto bruta salva</Text>
          <Text style={styles.cardText}>Use a câmera para capturar uma foto real.</Text>
        </View>
      ) : (
        capturedPhotos.map((photo) => (
          <View key={photo.id} style={styles.rawPhotoCard}>
            <Image source={{ uri: photo.uri }} style={styles.rawPhoto} />
            <View style={styles.rawPhotoTextBox}>
              <Text style={styles.cardTitle}>Foto bruta</Text>
              <Text style={styles.cardText}>Ainda não virou Fighter nem carta.</Text>
              <Text style={styles.cardText}>{new Date(photo.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        ))
      )}

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
  rawText: {
    color: "#f5a623",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
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
  rawPhotoCard: {
    backgroundColor: "#16213e",
    borderColor: "rgba(245,166,35,.35)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  rawPhoto: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#0f172a",
  },
  rawPhotoTextBox: {
    flex: 1,
    justifyContent: "center",
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
