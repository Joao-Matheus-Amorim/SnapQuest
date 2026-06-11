import { Link } from "expo-router";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useInventory } from "../hooks/useInventory";
import { useAuth } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";

export default function HomeScreen() {
  const { battleRequirements } = useInventory();
  const { user, loading, profile, profileLoading, profileError, signOut } = useAuth();
  const cloudSync = useCloudSync();
  const canBattle = battleRequirements.canBattle;
  const accountLabel = profile?.displayName || user?.email || "Conta SnapQuest";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SnapQuest</Text>
      <Text style={styles.subtitle}>Foto · Carta · Batalha</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{battleRequirements.fighterCount}</Text>
          <Text style={styles.statLbl}>Fighters</Text>
        </View>
        <View style={[styles.statBox, styles.statDivider]}>
          <Text style={styles.statNum}>{battleRequirements.cardCount}</Text>
          <Text style={styles.statLbl}>Cartas</Text>
        </View>
      </View>

      {!canBattle && (
        <Text style={styles.hint}>
          Precisa de {battleRequirements.minFighters} fighters e {battleRequirements.minCards} cartas para batalhar
        </Text>
      )}

      <Link href="/camera" asChild>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryText}>Nova Captura</Text>
        </Pressable>
      </Link>

      <View style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <Text style={styles.accountTitle}>Conta</Text>
          {loading || profileLoading ? <ActivityIndicator size="small" color="#f5a623" /> : null}
        </View>

        {user ? (
          <>
            <Text style={styles.accountPrimary}>{accountLabel}</Text>
            <Text style={styles.accountSecondary}>{user.email}</Text>
            <Text style={styles.accountMeta}>
              Nivel {profile?.level ?? 1} · XP {profile?.xp ?? 0}
              {profile?.canManageCatalog ? " · Catalogo admin" : ""}
            </Text>
            <Text
              style={[
                styles.syncText,
                cloudSync.status === "error" && styles.syncTextError,
                cloudSync.status === "synced" && styles.syncTextSuccess,
              ]}
            >
              {cloudSync.message}
            </Text>
            {profileError ? <Text style={styles.syncTextError}>{profileError}</Text> : null}
            <Pressable style={styles.secondaryButton} onPress={signOut}>
              <Text style={styles.secondaryButtonText}>Sair</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.accountPrimary}>Modo local</Text>
            <Text style={styles.accountSecondary}>
              Sem login, voce joga com catalogo e deck local sem progresso em nuvem.
            </Text>
            <Link href="/login" asChild>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Entrar / Criar conta</Text>
              </Pressable>
            </Link>
          </>
        )}
      </View>

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
  accountCard: {
    width: "100%",
    maxWidth: 320,
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,.25)",
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accountTitle: {
    color: "#f5a623",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  accountPrimary: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  accountSecondary: {
    color: "rgba(255,255,255,.7)",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  accountMeta: {
    color: "rgba(255,255,255,.55)",
    fontSize: 12,
    marginTop: 6,
  },
  syncText: {
    color: "rgba(255,255,255,.7)",
    fontSize: 12,
    marginTop: 10,
  },
  syncTextSuccess: {
    color: "#4caf50",
  },
  syncTextError: {
    color: "#ff7a7a",
    fontSize: 12,
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,.45)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#f5a623",
    fontSize: 14,
    fontWeight: "700",
  },
});
