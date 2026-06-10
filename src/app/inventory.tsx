import { useState } from "react";
import { Pressable, ScrollView, View, Text, StyleSheet } from "react-native";
import { useCapturedPhotos, type CapturedPhoto } from "../hooks/useCapturedPhotos";
import { useInventory } from "../hooks/useInventory";
import { usePlayerDeck } from "../hooks/usePlayerDeck";
import { transformCapturedPhoto } from "../services/geminiTransform";

export default function InventoryScreen() {
  const inv = useInventory();
  const raw = useCapturedPhotos();
  const deck = usePlayerDeck();
  const [busy, setBusy] = useState<string | null>(null);

  async function makeFighter(item: CapturedPhoto) {
    setBusy(item.id);

    try {
      const transform = await transformCapturedPhoto({ photo: item, target: "fighter" });
      await deck.addFighterFromPhoto(item, transform);
      await raw.removeCapturedPhoto(item.id);
      await inv.reload();
      await deck.reload();
    } finally {
      setBusy(null);
    }
  }

  async function makeCard(item: CapturedPhoto) {
    setBusy(item.id);

    try {
      const transform = await transformCapturedPhoto({ photo: item, target: "effect_card" });
      await deck.addCardFromPhoto(item, transform);
      await raw.removeCapturedPhoto(item.id);
      await inv.reload();
      await deck.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inventário</Text>
      <Text style={styles.subtitle}>Converta capturas em itens antes de jogar.</Text>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>Fighters: {inv.battleRequirements.fighterCount}/{inv.battleRequirements.minFighters}</Text>
        <Text style={styles.summaryText}>Cartas: {inv.battleRequirements.cardCount}/{inv.battleRequirements.minCards}</Text>
        <Text style={styles.rawText}>Pendentes: {raw.capturedPhotos.length}</Text>
      </View>
      <Text style={styles.sectionTitle}>Pendentes</Text>
      {raw.capturedPhotos.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>Item pendente</Text>
          <Text style={styles.cardText}>{new Date(item.createdAt).toLocaleString("pt-BR")}</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.button} disabled={busy === item.id} onPress={() => makeFighter(item)}>
              <Text style={styles.buttonText}>{busy === item.id ? "Gerando..." : "Virar Fighter"}</Text>
            </Pressable>
            <Pressable style={styles.outlineButton} disabled={busy === item.id} onPress={() => makeCard(item)}>
              <Text style={styles.outlineButtonText}>{busy === item.id ? "Gerando..." : "Virar Carta"}</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Fighters</Text>
      {inv.fighters.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.icon} {item.nome}</Text>
          <Text style={styles.cardText}>{item.classe}</Text>
        </View>
      ))}
      <Text style={styles.sectionTitle}>Cartas</Text>
      {inv.cards.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.icon} {item.nome_efeito}</Text>
          <Text style={styles.cardText}>{item.categoria} · {item.raridade}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#1a1a2e", padding: 24, paddingBottom: 40 },
  title: { color: "#f5a623", fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: 12 },
  subtitle: { color: "#ffffff", marginTop: 10, textAlign: "center", marginBottom: 18 },
  summaryBox: { borderColor: "#f5a623", borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 22 },
  summaryText: { color: "#ffffff", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 6 },
  rawText: { color: "#f5a623", fontSize: 14, fontWeight: "700", textAlign: "center", marginTop: 4 },
  sectionTitle: { color: "#f5a623", fontSize: 20, fontWeight: "800", marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: "#16213e", borderColor: "rgba(245,166,35,.35)", borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  button: { backgroundColor: "#e94560", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  buttonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  outlineButton: { borderColor: "#f5a623", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  outlineButtonText: { color: "#f5a623", fontSize: 13, fontWeight: "800" },
  cardTitle: { color: "#f5a623", fontSize: 17, fontWeight: "800", marginBottom: 4 },
  cardText: { color: "#ffffff", fontSize: 14, marginBottom: 2 },
});
