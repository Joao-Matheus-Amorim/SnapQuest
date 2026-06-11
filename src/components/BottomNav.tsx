import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { PressableScale } from "./motion/PressableScale";
import { COLORS, RADIUS } from "../theme/tokens";

const TABS = [
  { href: "/", label: "Base", mark: "I", color: COLORS.gold, side: "left" },
  { href: "/camera", label: "Portal", mark: "II", color: COLORS.accent, side: "mid" },
  { href: "/inventory", label: "Deck", mark: "III", color: COLORS.gold, side: "mid" },
  { href: "/battle", label: "Duelo", mark: "IV", color: COLORS.primary, side: "right" },
] as const;

export const BOTTOM_NAV_HEIGHT = 92;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={s.shell}>
      <View pointerEvents="none" style={s.ambientGlow} />
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "rgba(6,12,26,.98)", "rgba(6,12,26,1)"]}
        style={s.vignette}
      />
      <View pointerEvents="none" style={s.deckShadow} />
      <View pointerEvents="none" style={s.deck}>
        <LinearGradient
          colors={["rgba(234,242,255,.1)", "rgba(18,33,66,.96)", "rgba(6,12,26,1)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.deckLip} />
        <View style={s.deckCore} />
      </View>
      <View style={s.bar}>
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          return (
            <PressableScale
              key={tab.href}
              style={[s.runeSlot, active && s.activeRuneSlot, active && { shadowColor: tab.color }]}
              onPress={() => {
                if (!active) router.replace(tab.href);
              }}
              haptic="select"
              scaleTo={0.9}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <View pointerEvents="none" style={[s.beam, active && { backgroundColor: tab.color }]} />
              <View pointerEvents="none" style={[s.runeHalo, active && { backgroundColor: tab.color }]} />
              <View pointerEvents="none" style={[s.pedestal, active && { borderColor: tab.color }]}>
                <LinearGradient
                  pointerEvents="none"
                  colors={
                    active
                      ? ["rgba(255,255,255,.16)", "rgba(24,41,79,.96)", "rgba(10,18,38,1)"]
                      : ["rgba(234,242,255,.08)", "rgba(18,33,66,.9)", "rgba(10,18,38,1)"]
                  }
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <View style={[s.rune, active && s.activeRune, active && { borderColor: tab.color }]}>
                <View pointerEvents="none" style={[s.runeRing, active && { borderColor: tab.color }]} />
                <View pointerEvents="none" style={[s.orbit, tab.side === "left" && s.orbitLeft, tab.side === "right" && s.orbitRight, active && { borderColor: tab.color }]} />
                <View style={[s.gemShell, active && { backgroundColor: tab.color, shadowColor: tab.color }]}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={active ? ["rgba(255,255,255,.7)", tab.color, "rgba(6,12,26,.25)"] : ["rgba(234,242,255,.16)", "rgba(18,33,66,.9)", "rgba(6,12,26,.9)"]}
                    start={{ x: 0.35, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={[s.markText, active && s.activeMarkText]}>{tab.mark}</Text>
                </View>
                <View pointerEvents="none" style={[s.spark, active && { backgroundColor: tab.color }]} />
              </View>
              <View style={[s.labelPlate, active && { borderColor: tab.color }]}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[s.label, active && s.activeLabel]}>
                  {tab.label}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  shell: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_NAV_HEIGHT,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 8,
    shadowColor: COLORS.glow,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  ambientGlow: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 18,
    height: 58,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(108,140,255,.18)",
  },
  vignette: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -22,
    bottom: 0,
  },
  deckShadow: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 0,
    height: 58,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(0,0,0,.45)",
  },
  deck: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    height: 64,
    overflow: "hidden",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(234,242,255,.14)",
    backgroundColor: COLORS.bgNav,
  },
  deckLip: {
    position: "absolute",
    left: 22,
    right: 22,
    top: 7,
    height: 2,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(52,225,255,.4)",
  },
  deckCore: {
    position: "absolute",
    left: "38%",
    right: "38%",
    top: 10,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  bar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
  },
  runeSlot: {
    flex: 1,
    height: BOTTOM_NAV_HEIGHT,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 12,
    shadowOpacity: 0,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  activeRuneSlot: {
    paddingTop: 0,
    shadowOpacity: 0.78,
    elevation: 10,
  },
  beam: {
    position: "absolute",
    top: 18,
    width: 3,
    height: 54,
    borderRadius: RADIUS.round,
    opacity: 0.28,
  },
  runeHalo: {
    position: "absolute",
    top: 8,
    width: 68,
    height: 68,
    borderRadius: RADIUS.round,
    opacity: 0.2,
  },
  pedestal: {
    position: "absolute",
    bottom: 18,
    width: 62,
    height: 22,
    overflow: "hidden",
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    backgroundColor: COLORS.cardSurfaceDeep,
  },
  rune: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.14)",
    backgroundColor: "rgba(15,27,56,.78)",
    marginTop: 4,
  },
  activeRune: {
    width: 64,
    height: 64,
    marginTop: 0,
    backgroundColor: "rgba(24,41,79,.94)",
  },
  runeRing: {
    position: "absolute",
    inset: 5,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.12)",
  },
  orbit: {
    position: "absolute",
    width: 48,
    height: 16,
    borderRadius: RADIUS.round,
    borderTopWidth: 1,
    borderColor: "rgba(234,242,255,.22)",
    transform: [{ rotate: "-18deg" }],
  },
  orbitLeft: {
    transform: [{ rotate: "18deg" }],
  },
  orbitRight: {
    transform: [{ rotate: "-28deg" }],
  },
  gemShell: {
    width: 30,
    height: 30,
    overflow: "hidden",
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.24)",
    transform: [{ rotate: "45deg" }],
    shadowOpacity: 0.75,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  spark: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 5,
    height: 5,
    borderRadius: RADIUS.round,
    opacity: 0.9,
  },
  labelPlate: {
    minWidth: 58,
    maxWidth: 74,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.1)",
    backgroundColor: "rgba(6,12,26,.72)",
    marginTop: 2,
  },
  markText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "900",
    transform: [{ rotate: "-45deg" }],
  },
  activeMarkText: { color: COLORS.bgNav },
  label: { color: COLORS.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  activeLabel: { color: COLORS.cream },
});
