import { Link } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { useAuth } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";
import { useInventory } from "../hooks/useInventory";

function Metric({ value, label, tone = "default" }: { value: number; label: string; tone?: "default" | "accent" }) {
  return (
    <View style={[styles.metric, tone === "accent" && styles.metricAccent]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionLink({ href, label, detail, primary = false }: {
  href: "/" | "/camera" | "/inventory" | "/battle" | "/login";
  label: string;
  detail: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={[styles.action, primary && styles.actionPrimary]}>
        <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
        <Text style={[styles.actionDetail, primary && styles.actionDetailPrimary]}>{detail}</Text>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const { battleRequirements, catalogStatus, catalogErrorMessage } = useInventory();
  const { user, loading, profile, profileLoading, profileError, signOut } = useAuth();
  const cloudSync = useCloudSync();
  const accountLabel = profile?.displayName || user?.email || "Modo local";
  const busy = loading || profileLoading;
  const catalogNeedsAttention = catalogStatus === "error" || catalogStatus === "fallback";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View>
          <Text style={styles.kicker}>SnapQuest</Text>
          <Text style={styles.title}>Arena pronta para fotos, cartas e batalha.</Text>
        </View>
        <View style={styles.readyBadge}>
          <Text style={styles.readyBadgeText}>{battleRequirements.canBattle ? "PRONTO" : "SETUP"}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric value={battleRequirements.playerFighterCount} label="Meu deck" />
        <Metric value={battleRequirements.catalogFighterCount} label="Catalogo" tone="accent" />
        <Metric value={battleRequirements.cardCount} label="Cartas" />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Proximo passo</Text>
          {!battleRequirements.canBattle ? (
            <Text style={styles.panelMeta}>
              {battleRequirements.fighterCount}/{battleRequirements.minFighters} fighters · {battleRequirements.cardCount}/{battleRequirements.minCards} cartas
            </Text>
          ) : (
            <Text style={styles.panelMeta}>Batalha rapida liberada</Text>
          )}
        </View>
        <View style={styles.actionsGrid}>
          <ActionLink href="/camera" label="Nova captura" detail="Criar item" primary />
          <ActionLink href="/inventory" label="Inventario" detail="Deck e catalogo" />
          <ActionLink href="/battle" label="Batalha" detail={battleRequirements.canBattle ? "Iniciar" : "Bloqueada"} />
          <ActionLink href={user ? "/" : "/login"} label={user ? "Conta ativa" : "Entrar"} detail={user ? "Sincronizada" : "Nuvem"} />
        </View>
      </View>

      <View style={styles.accountPanel}>
        <View style={styles.accountHeader}>
          <View>
            <Text style={styles.accountEyebrow}>Conta</Text>
            <Text style={styles.accountName} numberOfLines={1}>{accountLabel}</Text>
          </View>
          {busy ? <ActivityIndicator size="small" color="#14b8a6" /> : null}
        </View>

        {user ? (
          <>
            <Text style={styles.accountMeta}>
              Nivel {profile?.level ?? 1} · XP {profile?.xp ?? 0}
              {profile?.canManageCatalog ? " · Catalogo admin" : ""}
            </Text>
            <Text
              style={[
                styles.syncText,
                cloudSync.status === "error" && styles.errorText,
                cloudSync.status === "synced" && styles.successText,
              ]}
            >
              {cloudSync.message}
            </Text>
            {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
            <Pressable style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sair</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.accountMeta}>Progresso em nuvem desativado.</Text>
            <Link href="/login" asChild>
              <Pressable style={styles.signOutButton}>
                <Text style={styles.signOutText}>Entrar ou criar conta</Text>
              </Pressable>
            </Link>
          </>
        )}
      </View>

      {catalogNeedsAttention && catalogErrorMessage ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{catalogErrorMessage}</Text>
        </View>
      ) : null}

      <BottomNav />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: "100%",
    backgroundColor: "#101623",
    padding: 20,
    paddingTop: 28,
    paddingBottom: BOTTOM_NAV_HEIGHT + 24,
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  kicker: { color: "#14b8a6", fontSize: 14, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#f8fafc", fontSize: 30, lineHeight: 36, fontWeight: "900", marginTop: 6, maxWidth: 270 },
  readyBadge: {
    minWidth: 64,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(20,184,166,.16)",
    borderWidth: 1,
    borderColor: "rgba(20,184,166,.35)",
    alignItems: "center",
  },
  readyBadgeText: { color: "#8ff5e6", fontSize: 11, fontWeight: "900" },
  metricsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  metric: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: "#162033",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
  },
  metricAccent: { borderColor: "rgba(20,184,166,.35)" },
  metricValue: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  metricLabel: { color: "rgba(248,250,252,.58)", fontSize: 11, fontWeight: "800", marginTop: 2 },
  panel: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#162033",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    marginBottom: 14,
  },
  panelHeader: { marginBottom: 12 },
  panelTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "900" },
  panelMeta: { color: "rgba(248,250,252,.62)", fontSize: 12, marginTop: 3, fontWeight: "700" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  action: {
    width: "48%",
    minHeight: 74,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#101623",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    justifyContent: "center",
  },
  actionPrimary: { backgroundColor: "#e11d48", borderColor: "#e11d48" },
  actionLabel: { color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  actionLabelPrimary: { color: "#fff" },
  actionDetail: { color: "rgba(248,250,252,.56)", fontSize: 12, marginTop: 4, fontWeight: "700" },
  actionDetailPrimary: { color: "rgba(255,255,255,.76)" },
  accountPanel: {
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#162033",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.08)",
    marginBottom: 14,
  },
  accountHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  accountEyebrow: { color: "#14b8a6", fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  accountName: { color: "#f8fafc", fontSize: 16, fontWeight: "900", marginTop: 3, maxWidth: 250 },
  accountMeta: { color: "rgba(248,250,252,.62)", fontSize: 12, marginTop: 10, lineHeight: 18 },
  syncText: { color: "rgba(248,250,252,.68)", fontSize: 12, marginTop: 10 },
  successText: { color: "#22c55e" },
  errorText: { color: "#fb7185", fontSize: 12, marginTop: 8 },
  signOutButton: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutText: { color: "rgba(248,250,252,.74)", fontWeight: "900" },
  notice: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: "rgba(225,29,72,.12)",
    borderWidth: 1,
    borderColor: "rgba(225,29,72,.32)",
  },
  noticeText: { color: "#fecdd3", fontSize: 12, lineHeight: 17, fontWeight: "700" },
});
