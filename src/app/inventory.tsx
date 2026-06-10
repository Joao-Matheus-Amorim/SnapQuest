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
      {raw.capturedPhotos.length === 0 ? <Text style={styles.emptyText}>Nenhuma captura bruta pendente.</Text> : null}
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

      <Text style={styles.sectionTitle}>Suas Cartas</Text>
      {inv.playerCards.length === 0 ? <Text style={styles.emptyText}>Nenhuma carta criada ainda.</Text> : null}
      {inv.playerCards.map((item) => (
        <View key={item.id} style={styles.highlightCard}>
          <Text style={styles.cardTitle}>{item.icon} {item.nome_efeito}</Text>
          <Text style={styles.cardText}>{item.categoria} · {item.raridade}</Text>
          <Text style={styles.cardText}>{item.polaridade} {item.atributo} +{item.intensidade}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Seus Fighters</Text>
      {inv.playerFighters.length === 0 ? <Text style={styles.emptyText}>Nenhum fighter criado ainda.</Text> : null}
      {inv.playerFighters.map((item) => (
        <View key={item.id} style={styles.highlightCard}>
          <Text style={styles.cardTitle}>{item.icon} {item.nome}</Text>
          <Text style={styles.cardText}>{item.classe}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Cartas Base</Text>
      {inv.cards.slice(inv.playerCards.length).map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.icon} {item.nome_efeito}</Text>
          <Text style={styles.cardText}>{item.categoria} · {item.raridade}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Fighters Base</Text>
      {inv.fighters.slice(inv.playerFighters.length).map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.icon} {item.nome}</Text>
          <Text style={styles.cardText}>{item.classe}</Text>
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
  highlightCard: { backgroundColor: "#21335f", borderColor: "#f5a623", borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  button: { backgroundColor: "#e94560", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  buttonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  outlineButton: { borderColor: "#f5a623", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  outlineButtonText: { color: "#f5a623", fontSize: 13, fontWeight: "800" },
  cardTitle: { color: "#f5a623", fontSize: 17, fontWeight: "800", marginBottom: 4 },
  cardText: { color: "#ffffff", fontSize: 14, marginBottom: 2 },
  emptyText: { color: "rgba(255,255,255,.72)", fontSize: 14, marginBottom: 12 },
});
