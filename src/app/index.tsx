import { Link } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useInventory } from "../hooks/useInventory";
import { useAuth } from "../hooks/useAuth";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";

export default function HomeScreen() {
  const { battleRequirements } = useInventory();
  const { user, signOut } = useAuth();
  const canBattle = battleRequirements.canBattle;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SnapQuest</Text>
      <Text style={styles.subtitle}>Foto · Carta · Batalha</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{battleRequirements.fighterCount}</Text>
          <Text style={styles.statLbl}>⚔️ Fighters</Text>
        </View>
        <View style={[styles.statBox, styles.statDivider]}>
          <Text style={styles.statNum}>{battleRequirements.cardCount}</Text>
          <Text style={styles.statLbl}>✨ Cartas</Text>
        </View>
      </View>

      {!canBattle && (
        <Text style={styles.hint}>
          Precisa de {battleRequirements.minFighters} fighters e {battleRequirements.minCards} cartas para batalhar
        </Text>
      )}

      <Link href="/camera" asChild>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryText}>📷 Nova Captura</Text>
        </Pressable>
      </Link>

      {user ? (
        <Pressable style={styles.accountButton} onPress={signOut}>
          <Text style={styles.accountText}>☁ {user.email}  ·  Sair</Text>
        </Pressable>
      ) : (
        <Link href="/login" asChild>
          <Pressable style={styles.accountButton}>
            <Text style={styles.accountText}>☁ Entrar / Criar conta</Text>
          </Pressable>
        </Link>
      )}

      <BottomNav />
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
    paddingBottom: BOTTOM_NAV_HEIGHT + 16,
  },
  title: { color: "#f5a623", fontSize: 48, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "rgba(255,255,255,.6)", fontSize: 15, marginBottom: 28 },
  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,.3)",
    borderRadius: 18,
    marginBottom: 8,
    overflow: "hidden",
    width: "100%",
    maxWidth: 320,
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: "rgba(245,166,35,.3)" },
  statNum: { color: "#f5a623", fontSize: 28, fontWeight: "800" },
  statLbl: { color: "rgba(255,255,255,.6)", fontSize: 12, marginTop: 2 },
  hint: {
    color: "rgba(255,255,255,.4)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    maxWidth: 280,
  },
  primaryButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 20,
    marginBottom: 14,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  accountButton: { marginTop: 20, paddingVertical: 8 },
  accountText: { color: "rgba(255,255,255,.4)", fontSize: 13, textAlign: "center" },
});
