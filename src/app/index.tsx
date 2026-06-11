import { Link } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { useAuth } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";
import { useInventory } from "../hooks/useInventory";

type RouteHref = "/" | "/camera" | "/inventory" | "/battle" | "/login";

function BattleCounter({ value, target, label }: { value: number; target: number; label: string }) {
  const pct = Math.max(0, Math.min(1, value / target));
  return (
    <View style={styles.counter}>
      <View style={styles.counterTop}>
        <Text style={styles.counterValue}>{value}</Text>
        <Text style={styles.counterTarget}>/{target}</Text>
      </View>
      <View style={styles.counterTrack}>
        <View style={[styles.counterFill, { width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

function QuestCard({ href, code, title, detail, tone = "dark" }: {
  href: RouteHref;
  code: string;
  title: string;
  detail: string;
  tone?: "dark" | "red" | "gold";
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={[styles.questCard, tone === "red" && styles.questRed, tone === "gold" && styles.questGold]}>
        <View style={styles.questCodeBox}>
          <Text style={styles.questCode}>{code}</Text>
        </View>
        <View style={styles.questCopy}>
          <Text style={styles.questTitle}>{title}</Text>
          <Text style={styles.questDetail}>{detail}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { battleRequirements, catalogStatus, catalogErrorMessage } = useInventory();
  const { user, loading, profile, profileLoading, profileError, signOut } = useAuth();
  const cloudSync = useCloudSync();
  const accountLabel = profile?.displayName || user?.email || "Visitante";
  const busy = loading || profileLoading;
  const canBattle = battleRequirements.canBattle;
  const catalogNeedsAttention = catalogStatus === "error" || catalogStatus === "fallback";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroFrame}>
        <View style={styles.heroTopLine}>
          <Text style={styles.realm}>SNAPQUEST</Text>
          <View style={[styles.stateChip, canBattle && styles.stateChipReady]}>
            <Text style={styles.stateChipText}>{canBattle ? "ARENA ABERTA" : "MONTANDO DECK"}</Text>
          </View>
        </View>

        <Text style={styles.title}>Mesa de Batalha</Text>
        <Text style={styles.subtitle}>Fotos viram criaturas, cartas viram truques, e o duelo acontece no mesmo celular.</Text>

        <View style={styles.deckGate}>
          <BattleCounter value={battleRequirements.fighterCount} target={battleRequirements.minFighters} label="Fighters" />
          <BattleCounter value={battleRequirements.cardCount} target={battleRequirements.minCards} label="Cartas" />
        </View>
      </View>

      <View style={styles.questGrid}>
        <QuestCard href="/camera" code="01" title="Portal de captura" detail="Fotografe e transforme" tone="red" />
        <QuestCard href="/inventory" code="02" title="Grimorio do deck" detail="Deck pessoal e catalogo" tone="gold" />
        <QuestCard href="/battle" code="03" title="Entrar no duelo" detail={canBattle ? "Comecar batalha" : "Faltam cartas"} />
        <QuestCard href={user ? "/" : "/login"} code="04" title={user ? "Conta vinculada" : "Salvar progresso"} detail={user ? "Sync ativo" : "Entrar na nuvem"} />
      </View>

      <View style={styles.collectionPanel}>
        <Text style={styles.sectionLabel}>Colecao</Text>
        <View style={styles.statsRow}>
          <MiniStat label="Meu deck" value={battleRequirements.playerFighterCount + battleRequirements.playerCardCount} />
          <MiniStat label="Catalogo" value={battleRequirements.catalogFighterCount + battleRequirements.catalogCardCount} />
          <MiniStat label="Prontos" value={battleRequirements.fighterCount + battleRequirements.cardCount} />
        </View>
      </View>

      <View style={styles.accountPanel}>
        <View style={styles.accountHeader}>
          <View style={styles.accountSigil}>
            <Text style={styles.accountSigilText}>{user ? "P" : "V"}</Text>
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.sectionLabel}>Perfil</Text>
            <Text style={styles.accountName} numberOfLines={1}>{accountLabel}</Text>
          </View>
          {busy ? <ActivityIndicator size="small" color="#f7c948" /> : null}
        </View>

        {user ? (
          <>
            <Text style={styles.accountMeta}>
              Nivel {profile?.level ?? 1} / XP {profile?.xp ?? 0}
              {profile?.canManageCatalog ? " / Mestre do catalogo" : ""}
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
            <Pressable style={styles.outlineButton} onPress={signOut}>
              <Text style={styles.outlineButtonText}>Sair da conta</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.accountMeta}>Batalha rapida liberada. Progresso em nuvem fica desligado.</Text>
            <Link href="/login" asChild>
              <Pressable style={styles.outlineButton}>
                <Text style={styles.outlineButtonText}>Vincular conta</Text>
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
    backgroundColor: "#120916",
    padding: 18,
    paddingTop: 24,
    paddingBottom: BOTTOM_NAV_HEIGHT + 24,
  },
  heroFrame: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(247,201,72,.78)",
    backgroundColor: "#25112f",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#f43f5e",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  realm: { color: "#f7c948", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  stateChip: {
    borderWidth: 1,
    borderColor: "rgba(244,63,94,.55)",
    backgroundColor: "rgba(244,63,94,.16)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stateChipReady: {
    borderColor: "rgba(34,197,94,.6)",
    backgroundColor: "rgba(34,197,94,.14)",
  },
  stateChipText: { color: "#fff7d6", fontSize: 10, fontWeight: "900" },
  title: { color: "#fff7d6", fontSize: 36, lineHeight: 40, fontWeight: "900", marginTop: 18 },
  subtitle: { color: "rgba(255,247,214,.72)", fontSize: 14, lineHeight: 20, marginTop: 8 },
  deckGate: { flexDirection: "row", gap: 10, marginTop: 18 },
  counter: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "rgba(18,9,22,.62)",
    borderWidth: 1,
    borderColor: "rgba(247,201,72,.26)",
    padding: 10,
  },
  counterTop: { flexDirection: "row", alignItems: "flex-end" },
  counterValue: { color: "#ffffff", fontSize: 26, fontWeight: "900" },
  counterTarget: { color: "rgba(255,247,214,.58)", fontSize: 13, fontWeight: "900", marginBottom: 4 },
  counterTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,.12)", marginTop: 8, overflow: "hidden" },
  counterFill: { height: 6, borderRadius: 3, backgroundColor: "#f7c948" },
  counterLabel: { color: "rgba(255,247,214,.72)", fontSize: 11, fontWeight: "900", marginTop: 7, textTransform: "uppercase" },
  questGrid: { gap: 10, marginBottom: 14 },
  questCard: {
    minHeight: 76,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.18)",
    backgroundColor: "#1b1023",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  questRed: { borderColor: "rgba(244,63,94,.55)", backgroundColor: "#32101e" },
  questGold: { borderColor: "rgba(247,201,72,.58)", backgroundColor: "#2d2110" },
  questCodeBox: {
    width: 44,
    height: 52,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.28)",
    backgroundColor: "rgba(0,0,0,.22)",
  },
  questCode: { color: "#f7c948", fontSize: 18, fontWeight: "900" },
  questCopy: { flex: 1 },
  questTitle: { color: "#fff7d6", fontSize: 16, fontWeight: "900" },
  questDetail: { color: "rgba(255,247,214,.62)", fontSize: 12, fontWeight: "800", marginTop: 4 },
  collectionPanel: {
    borderRadius: 8,
    backgroundColor: "#1b1023",
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.14)",
    padding: 12,
    marginBottom: 14,
  },
  sectionLabel: { color: "#f7c948", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  miniStat: {
    flex: 1,
    minHeight: 64,
    borderRadius: 8,
    backgroundColor: "rgba(18,9,22,.7)",
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.1)",
    padding: 10,
    justifyContent: "center",
  },
  miniStatValue: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  miniStatLabel: { color: "rgba(255,247,214,.6)", fontSize: 10, fontWeight: "900", marginTop: 3 },
  accountPanel: {
    borderRadius: 8,
    backgroundColor: "#1b1023",
    borderWidth: 1,
    borderColor: "rgba(255,247,214,.14)",
    padding: 12,
    marginBottom: 14,
  },
  accountHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  accountSigil: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7c948",
  },
  accountSigilText: { color: "#1b1023", fontSize: 18, fontWeight: "900" },
  accountCopy: { flex: 1 },
  accountName: { color: "#fff7d6", fontSize: 16, fontWeight: "900", marginTop: 2 },
  accountMeta: { color: "rgba(255,247,214,.66)", fontSize: 12, lineHeight: 18, marginTop: 10 },
  syncText: { color: "rgba(255,247,214,.7)", fontSize: 12, marginTop: 10 },
  successText: { color: "#86efac" },
  errorText: { color: "#fb7185", fontSize: 12, marginTop: 8 },
  outlineButton: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(247,201,72,.45)",
    paddingVertical: 12,
    alignItems: "center",
  },
  outlineButtonText: { color: "#f7c948", fontSize: 13, fontWeight: "900" },
  notice: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: "rgba(244,63,94,.14)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,.38)",
  },
  noticeText: { color: "#fecdd3", fontSize: 12, lineHeight: 17, fontWeight: "800" },
});
