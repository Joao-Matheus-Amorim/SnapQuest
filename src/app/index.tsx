import { useRouter } from "expo-router";
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameButton } from "../components/game/GameButton";
import { VideoBackground } from "../components/game/VideoBackground";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { useAuth } from "../hooks/useAuth";
import { useCloudSync } from "../hooks/useCloudSync";
import { useInventory } from "../hooks/useInventory";
import { COLORS } from "../theme/tokens";

function GemCounter({ icon, value, target, label, color }: {
  icon: string; value: number; target: number; label: string; color: string;
}) {
  const pct = Math.max(0, Math.min(1, target ? value / target : 0));
  const full = value >= target;
  return (
    <View style={[styles.gem, { borderColor: color + "66", shadowColor: color }]}>
      <LinearGradient colors={[COLORS.panelHero, COLORS.bgDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, { shadowColor: color, borderColor: color + "aa" }]}>
        <LinearGradient colors={[color, color + "33"]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <Text style={styles.orbIcon}>{icon}</Text>
      </View>
      <View style={styles.gemBody}>
        <View style={styles.gemTop}>
          <Text style={styles.gemValue}>{value}</Text>
          <Text style={[styles.gemTarget, full && { color }]}>/{target}</Text>
        </View>
        <View style={styles.gemTrack}>
          <View style={[styles.gemFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color, shadowColor: color }]} />
        </View>
        <Text style={styles.gemLabel}>{label}</Text>
      </View>
    </View>
  );
}

function HudChip({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <View style={[styles.hudChip, { borderColor: color + "88" }]}>
      <Text style={[styles.hudChipIcon, { color }]}>{icon}</Text>
      <Text style={styles.hudChipText}>{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { battleRequirements, catalogStatus, catalogErrorMessage } = useInventory();
  const { user, loading, profile, profileLoading } = useAuth();
  const cloudSync = useCloudSync();

  const canBattle = battleRequirements.canBattle;
  const busy = loading || profileLoading;
  const collection =
    battleRequirements.playerFighterCount + battleRequirements.playerCardCount +
    battleRequirements.catalogFighterCount + battleRequirements.catalogCardCount;
  const accountLabel = profile?.displayName || user?.email || "Visitante";
  const catalogNeedsAttention = catalogStatus === "error" || catalogStatus === "fallback";

  return (
    <View style={styles.root}>
      <VideoBackground />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
        {/* HUD topo */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.hudRow}>
          <View style={styles.hudLeft}>
            <HudChip icon="★" value={`Nv ${profile?.level ?? 1}`} color={COLORS.gold} />
            <HudChip icon="◆" value={`${collection}`} color={COLORS.accent} />
          </View>
          <GameButton
            title={user ? (profile?.displayName || user.email || "Conta").split("@")[0].split(" ")[0] : "Entrar"}
            subtitle={user ? "Conectado" : undefined}
            variant={user ? "accent" : "dark"}
            size="md"
            haptic="tap"
            onPress={() => router.push("/login")}
            style={styles.hudAccount}
          />
        </Animated.View>

        {/* Heroi */}
        <Animated.View entering={FadeInDown.delay(80).duration(500).springify().damping(16)} style={styles.hero}>
          <Text style={styles.wordmark}>SNAPQUEST</Text>
          <View style={[styles.stateChip, canBattle && styles.stateChipReady]}>
            <Text style={[styles.stateChipText, { color: canBattle ? COLORS.greenSoft : COLORS.primary }]}>
              {canBattle ? "⚔  ARENA ABERTA" : "◔  MONTANDO DECK"}
            </Text>
          </View>
          <Text style={styles.tagline}>Fotos viram criaturas. O duelo acontece no mesmo celular.</Text>
        </Animated.View>

        {/* Orbes */}
        <Animated.View entering={FadeInDown.delay(160).duration(500).springify().damping(16)} style={styles.gemRow}>
          <GemCounter icon="⚔" value={battleRequirements.fighterCount} target={battleRequirements.minFighters} label="FIGHTERS" color={COLORS.primary} />
          <GemCounter icon="✦" value={battleRequirements.cardCount} target={battleRequirements.minCards} label="CARTAS" color={COLORS.accent} />
        </Animated.View>

        {/* Acoes */}
        <Animated.View entering={FadeInDown.delay(240).duration(500).springify().damping(16)} style={styles.actions}>
          <GameButton
            title="DUELAR"
            subtitle={canBattle ? "Entrar na arena" : "Faltam cartas para o duelo"}
            icon="⚔"
            variant="primary"
            size="lg"
            disabled={!canBattle}
            haptic="success"
            onPress={() => router.push("/battle")}
          />
          <View style={styles.tileRow}>
            <GameButton title="Capturar" subtitle="Portal" icon="📸" variant="accent" size="md" onPress={() => router.push("/camera")} style={styles.tile} />
            <GameButton title="Grimorio" subtitle="Deck" icon="📕" variant="gold" size="md" onPress={() => router.push("/inventory")} style={styles.tile} />
          </View>
        </Animated.View>

        {/* status */}
        <Animated.View entering={FadeIn.delay(360).duration(500)} style={styles.statusBar}>
          {busy ? <ActivityIndicator size="small" color={COLORS.accent} /> : null}
          <Text style={styles.statusText} numberOfLines={1}>
            {user ? `${accountLabel} · ${cloudSync.message}` : "Jogo livre · progresso sem nuvem"}
          </Text>
        </Animated.View>

        {catalogNeedsAttention && catalogErrorMessage ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{catalogErrorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgNav },
  content: { paddingHorizontal: 18, paddingBottom: BOTTOM_NAV_HEIGHT + 24, minHeight: "100%" },

  hudRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  hudLeft: { flexDirection: "row", gap: 8 },
  hudChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(6,12,26,.7)", borderWidth: 1.5, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  hudChipIcon: { fontSize: 13, fontWeight: "900" },
  hudChipText: { color: COLORS.cream, fontSize: 13, fontWeight: "900" },
  hudAccount: { width: 128 },

  hero: { alignItems: "center", marginTop: 20, marginBottom: 4 },
  wordmark: {
    color: COLORS.gold, fontSize: 32, fontWeight: "900", letterSpacing: 5,
    textShadowColor: "rgba(255,61,180,.7)", textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 },
  },
  stateChip: {
    marginTop: 14, borderWidth: 1.5, borderColor: "rgba(255,61,180,.55)",
    backgroundColor: "rgba(255,61,180,.12)", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7,
  },
  stateChipReady: { borderColor: "rgba(34,197,94,.65)", backgroundColor: "rgba(34,197,94,.14)" },
  stateChipText: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  tagline: { color: "rgba(234,242,255,.72)", fontSize: 13, textAlign: "center", marginTop: 14, lineHeight: 19, paddingHorizontal: 16 },

  gemRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  gem: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 18, padding: 12, overflow: "hidden",
    shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  orb: {
    width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center",
    overflow: "hidden", borderWidth: 1.5,
    shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  orbIcon: { fontSize: 22, color: "#fff", textShadowColor: "rgba(0,0,0,.4)", textShadowRadius: 3 },
  gemBody: { flex: 1 },
  gemTop: { flexDirection: "row", alignItems: "flex-end" },
  gemValue: { color: "#fff", fontSize: 26, fontWeight: "900" },
  gemTarget: { color: "rgba(234,242,255,.5)", fontSize: 13, fontWeight: "900", marginBottom: 3 },
  gemTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.1)", marginTop: 5, overflow: "hidden" },
  gemFill: { height: 5, borderRadius: 3, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  gemLabel: { color: "rgba(234,242,255,.6)", fontSize: 10, fontWeight: "900", marginTop: 6, letterSpacing: 1.2 },

  actions: { marginTop: 28, gap: 14 },
  tileRow: { flexDirection: "row", gap: 12 },
  tile: { flex: 1 },

  statusBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 },
  statusText: { color: "rgba(234,242,255,.7)", fontSize: 12, fontWeight: "700" },

  notice: { marginTop: 14, borderRadius: 12, padding: 12, backgroundColor: "rgba(255,77,109,.14)", borderWidth: 1, borderColor: "rgba(255,77,109,.4)" },
  noticeText: { color: "#ffd3dc", fontSize: 12, lineHeight: 17, fontWeight: "700" },
});
