import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { GameButton } from "./game/GameButton";
import { fighterRarity, cardRarity, RARITY_COLORS, RARITY_LABELS, RARITY_ORDER, type Rarity } from "../lib/rarityConfig";
import { fireHaptic, type HapticEvent } from "../lib/haptics";
import { useReducedMotion } from "../lib/useReducedMotion";
import { COLORS, RADIUS, SPRING } from "../theme/tokens";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

export type RevealTarget =
  | { kind: "fighter"; data: Fighter }
  | { kind: "card"; data: EffectCard }
  | null;

const CARD_WIDTH = 208;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.6);
const RING_SIZE = 360;

function rarityRank(rarity: Rarity) {
  return Math.max(0, RARITY_ORDER.indexOf(rarity));
}

function chargeMs(rarity: Rarity, reduced: boolean) {
  if (reduced) return 80;
  return [460, 660, 920, 1280, 1680][rarityRank(rarity)] ?? 820;
}

function revealName(reveal: NonNullable<RevealTarget>) {
  return reveal.kind === "fighter" ? reveal.data.nome : reveal.data.nome_efeito;
}

function revealKindLabel(reveal: NonNullable<RevealTarget>) {
  return reveal.kind === "fighter" ? "FIGHTER" : "CARTA";
}

function revealIcon(reveal: NonNullable<RevealTarget>) {
  return reveal.kind === "fighter" ? reveal.data.icon ?? "F" : reveal.data.icon ?? "C";
}

function revealPhoto(reveal: NonNullable<RevealTarget>) {
  return reveal.kind === "fighter" ? reveal.data.foto : reveal.data.foto;
}

function isRenderablePhoto(uri?: string | null) {
  if (!uri) return false;
  if (uri.includes("/var/mobile/Media/") || uri.includes("/DCIM/")) return false;
  return uri.startsWith("file://") || uri.startsWith("http") || uri.startsWith("data:") || uri.startsWith("content://");
}

function revealDetail(reveal: NonNullable<RevealTarget>) {
  if (reveal.kind === "fighter") return reveal.data.golpe || reveal.data.classe || "Criatura revelada";
  return `${reveal.data.polaridade} | ${reveal.data.atributo} +${reveal.data.intensidade}`;
}

function PreviewCard({ reveal, rarity, color }: { reveal: NonNullable<RevealTarget>; rarity: Rarity; color: string }) {
  const fighter = reveal.kind === "fighter" ? reveal.data : null;
  const card = reveal.kind === "card" ? reveal.data : null;
  const polarityColor = card?.polaridade === "DEBUFF" ? COLORS.red : COLORS.greenSoft;
  const photoUri = revealPhoto(reveal);
  const hasPhoto = isRenderablePhoto(photoUri);
  const premium = rarityRank(rarity) >= 3;
  const levelLabel = reveal.kind === "fighter" ? `HP ${reveal.data.hp}` : `${reveal.data.atributo} +${reveal.data.intensidade}`;

  return (
    <View style={[s.previewCard, { borderColor: color, shadowColor: color }, premium && s.previewCardPremium]}>
      <LinearGradient colors={[color + "55", COLORS.panelGold, COLORS.cardSurfaceDeep, COLORS.bgNav]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[s.cardFoilBand, { backgroundColor: color }]} />
      <View style={[s.cardFoilBandAlt, { backgroundColor: COLORS.accent }]} />

      <View style={[s.cardHeader, { borderColor: color }]}>
        <View style={[s.kindMedal, { borderColor: COLORS.gold, backgroundColor: color }]}>
          <Text style={s.kindMedalText}>{revealIcon(reveal)}</Text>
        </View>
        <View style={s.headerTextWrap}>
          <Text style={s.previewName} numberOfLines={1}>{revealName(reveal)}</Text>
          <Text style={s.previewKind}>{revealKindLabel(reveal)} | {RARITY_LABELS[rarity]}</Text>
        </View>
        <View style={[s.powerSeal, { borderColor: color }]}>
          <Text style={[s.powerSealText, { color }]}>{levelLabel}</Text>
        </View>
      </View>

      <View style={[s.artFrame, { borderColor: color }]}>
        <View style={s.artBevel}>
          {hasPhoto ? (
            <Image source={{ uri: photoUri ?? undefined }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[color + "66", COLORS.panelHero, COLORS.bgDeep]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient colors={["rgba(255,255,255,.2)", "transparent", "rgba(6,12,26,.62)"]} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
          {!hasPhoto ? (
            <View style={[s.previewOrb, { borderColor: COLORS.gold, shadowColor: color }]}>
              <Text style={s.previewIcon}>{revealIcon(reveal)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[s.effectPanel, { borderColor: color }]}>
        <Text style={s.previewDetail} numberOfLines={2}>{revealDetail(reveal)}</Text>

        {fighter ? (
          <View style={s.arenaStats}>
            <View style={[s.arenaStat, { borderColor: COLORS.red }]}>
              <Text style={[s.arenaStatValue, { color: COLORS.red }]}>{fighter.atk}</Text>
              <Text style={s.arenaStatLabel}>ATK</Text>
            </View>
            <View style={[s.arenaStat, { borderColor: COLORS.accent }]}>
              <Text style={[s.arenaStatValue, { color: COLORS.accent }]}>{fighter.def}</Text>
              <Text style={s.arenaStatLabel}>DEF</Text>
            </View>
            <View style={[s.arenaStat, { borderColor: COLORS.gold }]}>
              <Text style={[s.arenaStatValue, { color: COLORS.gold }]}>{fighter.lck}</Text>
              <Text style={s.arenaStatLabel}>LCK</Text>
            </View>
            <View style={[s.arenaStat, { borderColor: COLORS.greenSoft }]}>
              <Text style={[s.arenaStatValue, { color: COLORS.greenSoft }]}>{fighter.spd}</Text>
              <Text style={s.arenaStatLabel}>SPD</Text>
            </View>
          </View>
        ) : null}

        {card ? (
          <View style={[s.cardEffectArena, { borderColor: polarityColor, backgroundColor: polarityColor + "20" }]}>
            <Text style={[s.cardEffectMain, { color: polarityColor }]}>{card.polaridade}</Text>
            <Text style={s.cardEffectSub}>{card.atributo} +{card.intensidade}</Text>
          </View>
        ) : null}
      </View>

      <View pointerEvents="none" style={[s.cardInset, { borderColor: color + "77" }]} />
      <View pointerEvents="none" style={s.cardTopLine} />
      <View pointerEvents="none" style={[s.cornerGem, s.cornerGemTl, { borderColor: color, backgroundColor: premium ? color : COLORS.cardSurfaceDeep }]} />
      <View pointerEvents="none" style={[s.cornerGem, s.cornerGemTr, { borderColor: color, backgroundColor: premium ? COLORS.gold : COLORS.cardSurfaceDeep }]} />
      <View pointerEvents="none" style={[s.cornerGem, s.cornerGemBl, { borderColor: color, backgroundColor: premium ? COLORS.accent : COLORS.cardSurfaceDeep }]} />
      <View pointerEvents="none" style={[s.cornerGem, s.cornerGemBr, { borderColor: color, backgroundColor: premium ? color : COLORS.cardSurfaceDeep }]} />
    </View>
  );
}

export function RevealModal({ reveal, onClose }: { reveal: RevealTarget; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);

  const rarity: Rarity = reveal
    ? reveal.kind === "fighter"
      ? fighterRarity(reveal.data.bonus_intensidade ?? 1)
      : cardRarity(reveal.data.raridade ?? "")
    : "comum";
  const rank = rarityRank(rarity);
  const color = RARITY_COLORS[rarity];
  const legendary = rank >= 4;
  const high = rank >= 3;
  const delay = chargeMs(rarity, reduced);

  const charge = useSharedValue(0);
  const revealT = useSharedValue(0);
  const pulse = useSharedValue(0.5);
  const spin = useSharedValue(0);
  const flash = useSharedValue(0);

  const hapticEvent = useMemo<HapticEvent>(() => (legendary ? "legendary" : high ? "reveal" : "success"), [high, legendary]);

  useEffect(() => {
    if (!reveal) return;

    setDone(false);
    charge.value = 0;
    revealT.value = 0;
    pulse.value = 0.5;
    spin.value = 0;
    flash.value = 0;

    if (!reduced) {
      pulse.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
      spin.value = withRepeat(withTiming(1, { duration: 16000, easing: Easing.linear }), -1, false);
    }

    charge.value = withTiming(1, { duration: delay, easing: Easing.in(Easing.cubic) });
    revealT.value = withDelay(delay, withSpring(1, SPRING.settle));
    flash.value = withDelay(
      delay,
      withSequence(
        withTiming(high ? 1 : 0.62, { duration: reduced ? 1 : 80 }),
        withTiming(0, { duration: reduced ? 1 : legendary ? 620 : 340 })
      )
    );

    const timer = setTimeout(() => {
      fireHaptic(hapticEvent);
      setDone(true);
    }, delay + (reduced ? 40 : 320));

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, rarity, reduced]);

  const backPortalStyle = useAnimatedStyle(() => ({
    opacity: 0.14 + charge.value * 0.32 + revealT.value * 0.14,
    transform: [
      { perspective: 1000 },
      { rotateX: "68deg" },
      { scale: 0.84 + charge.value * 0.16 + pulse.value * 0.03 },
      { rotateZ: `${spin.value * -90}deg` },
    ],
  }));

  const beamStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0.28 : 0.16 + charge.value * (0.28 + rank * 0.03) + revealT.value * 0.14,
    transform: [
      { scaleY: 0.86 + charge.value * 0.12 + pulse.value * 0.04 },
      { scaleX: 0.82 + revealT.value * 0.1 },
    ],
  }));

  const sideGlowStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : 0.07 + charge.value * (0.16 + rank * 0.025) + revealT.value * 0.12,
    transform: [
      { translateY: (pulse.value - 0.5) * -18 },
      { scale: 0.96 + pulse.value * 0.05 },
    ],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 0.92 - revealT.value * 1.18),
    transform: [
      { scale: 0.56 + charge.value * 0.34 + pulse.value * 0.03 },
      { rotateZ: `${spin.value * (160 + rank * 30)}deg` },
    ],
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : Math.max(0, 1 - revealT.value) * (0.34 + rank * 0.04),
    transform: [{ scale: 0.62 + revealT.value * (1.25 + rank * 0.08) }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: revealT.value,
    transform: [
      { perspective: 1000 },
      { translateY: (1 - revealT.value) * 72 },
      { scale: 0.56 + revealT.value * 0.44 },
      { rotateX: `${(1 - revealT.value) * 24}deg` },
      { rotateY: `${(1 - revealT.value) * -42}deg` },
      { rotateZ: `${(1 - revealT.value) * -8}deg` },
    ],
  }));

  const cardAuraStyle = useAnimatedStyle(() => ({
    opacity: revealT.value * (0.18 + rank * 0.035 + pulse.value * 0.14),
    transform: [
      { scale: 0.96 + revealT.value * 0.07 + pulse.value * 0.025 },
    ],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : revealT.value * (0.22 + rank * 0.045 + pulse.value * 0.24),
    transform: [
      { translateX: -CARD_WIDTH + spin.value * CARD_WIDTH * 2 },
      { rotateZ: "14deg" },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: revealT.value,
    transform: [{ translateY: (1 - revealT.value) * 18 }],
  }));

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  if (!reveal) return null;

  const centerTop = height / 2 - 82;

  return (
    <View style={[StyleSheet.absoluteFill, s.root]} pointerEvents="auto">
      {reduced ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(6,12,26,.97)" }]} />
      ) : (
        <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFill}>
          <LinearGradient colors={["rgba(6,12,26,.98)", "rgba(15,27,56,.94)", "rgba(6,12,26,.98)"]} style={StyleSheet.absoluteFill} />
        </BlurView>
      )}
      <Pressable style={StyleSheet.absoluteFill} disabled={!done} onPress={onClose} />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={["rgba(255,61,180,.24)", "transparent", "rgba(52,225,255,.2)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, s.energyWash]} />
        <LinearGradient colors={["transparent", "rgba(245,197,66,.16)", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[StyleSheet.absoluteFill, s.energyColumn]} />
      </View>

      <Animated.View pointerEvents="none" style={[s.beam, { top: centerTop - 285 }, beamStyle]}>
        <LinearGradient colors={["transparent", color + "55", "rgba(255,255,255,.22)", color + "35", "transparent"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[s.sideGlowLeft, { top: centerTop - 208, backgroundColor: COLORS.primary, shadowColor: COLORS.primary }, sideGlowStyle]} />
      <Animated.View pointerEvents="none" style={[s.sideGlowRight, { top: centerTop - 196, backgroundColor: COLORS.accent, shadowColor: COLORS.accent }, sideGlowStyle]} />

      <Animated.View pointerEvents="none" style={[s.portal, { top: centerTop - RING_SIZE / 2, shadowColor: color }, backPortalStyle]}>
        <View style={[s.ringOuter, { borderColor: color }]} />
        <View style={[s.ringMid, { borderColor: COLORS.accent }]} />
        <View style={[s.ringInner, { borderColor: COLORS.gold }]} />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[s.portalCore, { top: centerTop - 62 }, coreStyle]}>
        <LinearGradient colors={[COLORS.primary, COLORS.accent, COLORS.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={s.portalCoreCut} />
      </Animated.View>

      <Animated.View pointerEvents="none" style={[s.burst, { top: centerTop - 120, backgroundColor: color, shadowColor: color }, burstStyle]} />

      <Animated.View style={[s.cardWrap, cardStyle]}>
        <Animated.View pointerEvents="none" style={[s.cardAura, { borderColor: color, shadowColor: color }, cardAuraStyle]} />
        <View pointerEvents="none" style={[s.backLight, { borderColor: color, shadowColor: color }]} />
        <View style={s.previewClip}>
          <PreviewCard reveal={reveal} rarity={rarity} color={color} />
          <Animated.View pointerEvents="none" style={[s.cardSweep, sweepStyle]}>
            <LinearGradient colors={["transparent", "rgba(255,255,255,.76)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={[s.labelWrap, labelStyle]}>
        <View style={[s.raritySeal, { borderColor: color, shadowColor: color }]}>
          <Text style={[s.rarityText, { color }]}>{RARITY_LABELS[rarity]}</Text>
        </View>
        {legendary ? <Text style={s.legendary}>JACKPOT ARCANO</Text> : null}
        <Text style={s.name} numberOfLines={2}>{revealName(reveal)}</Text>
        <Text style={s.move} numberOfLines={1}>{revealDetail(reveal)}</Text>
        {done ? (
          <GameButton
            title="COLETAR"
            variant={legendary ? "gold" : high ? "primary" : "accent"}
            size="md"
            haptic="tap"
            shimmer={high}
            onPress={onClose}
            style={s.collect}
          />
        ) : (
          <Text style={s.charging}>canalizando raridade...</Text>
        )}
      </Animated.View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: legendary ? "#ffffff" : color }, flashStyle]} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", paddingHorizontal: 22, zIndex: 100, elevation: 100 },
  energyWash: { opacity: 0.42 },
  energyColumn: { opacity: 0.52, transform: [{ scaleX: 0.54 }, { rotateZ: "-5deg" }] },
  beam: {
    position: "absolute",
    width: 180,
    height: 570,
    borderRadius: RADIUS.round,
    overflow: "hidden",
  },
  sideGlowLeft: {
    position: "absolute",
    left: -72,
    width: 150,
    height: 420,
    borderRadius: RADIUS.round,
    opacity: 0.18,
    shadowOpacity: 0.7,
    shadowRadius: 46,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ rotateZ: "-13deg" }],
  },
  sideGlowRight: {
    position: "absolute",
    right: -74,
    width: 150,
    height: 420,
    borderRadius: RADIUS.round,
    opacity: 0.18,
    shadowOpacity: 0.7,
    shadowRadius: 46,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ rotateZ: "13deg" }],
  },
  portal: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.96,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 0 },
  },
  ringOuter: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    opacity: 0.42,
  },
  ringMid: {
    position: "absolute",
    width: 266,
    height: 266,
    borderRadius: RADIUS.round,
    borderWidth: 1.2,
    opacity: 0.36,
  },
  ringInner: {
    position: "absolute",
    width: 182,
    height: 182,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    opacity: 0.34,
  },
  portalCore: {
    position: "absolute",
    width: 124,
    height: 124,
    borderRadius: RADIUS.round,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.92,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  portalCoreCut: {
    position: "absolute",
    left: 27,
    top: 27,
    right: 27,
    bottom: 27,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(6,12,26,.82)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,.6)",
  },
  burst: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: RADIUS.round,
    shadowOpacity: 1,
    shadowRadius: 70,
    shadowOffset: { width: 0, height: 0 },
  },
  cardWrap: { alignItems: "center", justifyContent: "center", marginTop: -36 },
  cardAura: {
    position: "absolute",
    width: CARD_WIDTH + 46,
    height: CARD_HEIGHT + 52,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    opacity: 0.42,
    shadowOpacity: 0.78,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  backLight: {
    position: "absolute",
    width: CARD_WIDTH + 58,
    height: CARD_HEIGHT + 60,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    opacity: 0.52,
    shadowOpacity: 0.94,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ rotateZ: "-3deg" }, { scale: 1.02 }],
  },
  previewClip: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  previewCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: "hidden",
    borderRadius: 10,
    borderWidth: 2.5,
    backgroundColor: COLORS.cardSurface,
    padding: 9,
    shadowOpacity: 0.76,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  previewCardPremium: { borderWidth: 3 },
  cardFoilBand: {
    position: "absolute",
    top: -38,
    bottom: -38,
    left: -42,
    width: 72,
    opacity: 0.1,
    transform: [{ rotateZ: "-18deg" }, { scaleX: 0.55 }],
  },
  cardFoilBandAlt: {
    position: "absolute",
    top: -44,
    bottom: -44,
    right: -28,
    width: 54,
    opacity: 0.08,
    transform: [{ rotateZ: "17deg" }, { scaleX: 0.62 }],
  },
  cardSweep: {
    position: "absolute",
    top: -60,
    bottom: -60,
    width: 72,
    left: 0,
  },
  cardHeader: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(6,12,26,.76)",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 7,
    marginBottom: 7,
  },
  kindMedal: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.gold,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  kindMedalText: { color: COLORS.cream, fontSize: 17, fontWeight: "900" },
  headerTextWrap: { flex: 1, minWidth: 0 },
  powerSeal: {
    minWidth: 42,
    maxWidth: 56,
    minHeight: 32,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: "rgba(6,12,26,.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  powerSealText: { fontSize: 9, lineHeight: 11, fontWeight: "900", textAlign: "center" },
  artFrame: {
    height: 154,
    borderRadius: 9,
    borderWidth: 2,
    backgroundColor: COLORS.panelGold,
    padding: 4,
    marginBottom: 7,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  artBevel: {
    flex: 1,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgDeep,
  },
  effectPanel: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "rgba(6,12,26,.82)",
    padding: 7,
    justifyContent: "space-between",
  },
  previewOrb: {
    width: 86,
    height: 86,
    borderRadius: RADIUS.round,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    backgroundColor: "rgba(6,12,26,.5)",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  previewIcon: { color: COLORS.cream, fontSize: 42, fontWeight: "900" },
  previewKind: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  previewName: { color: COLORS.cream, fontSize: 13, lineHeight: 15, fontWeight: "900" },
  previewDetail: { color: COLORS.cream, fontSize: 10, lineHeight: 13, fontWeight: "800", opacity: 0.86 },
  arenaStats: { flexDirection: "row", gap: 5, justifyContent: "space-between" },
  arenaStat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 7,
    backgroundColor: "rgba(234,242,255,.06)",
    alignItems: "center",
    paddingVertical: 4,
  },
  arenaStatValue: { fontSize: 13, lineHeight: 15, fontWeight: "900" },
  arenaStatLabel: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  cardEffectArena: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: "center",
    gap: 2,
  },
  cardEffectMain: { fontSize: 13, lineHeight: 15, fontWeight: "900", letterSpacing: 0.8 },
  cardEffectSub: { color: COLORS.cream, fontSize: 10, fontWeight: "900" },
  cardInset: {
    position: "absolute",
    inset: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    opacity: 0.5,
  },
  cardTopLine: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 7,
    height: 1,
    backgroundColor: "rgba(255,255,255,.34)",
  },
  cornerGem: {
    position: "absolute",
    width: 13,
    height: 13,
    borderWidth: 1,
    opacity: 0.86,
    shadowColor: "#ffffff",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ rotateZ: "45deg" }],
  },
  cornerGemTl: { top: 8, left: 8 },
  cornerGemTr: { top: 8, right: 8 },
  cornerGemBl: { bottom: 8, left: 8 },
  cornerGemBr: { bottom: 8, right: 8 },
  labelWrap: { position: "absolute", bottom: 48, alignItems: "center", width: "100%" },
  raritySeal: {
    borderWidth: 1.5,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(6,12,26,.82)",
    paddingHorizontal: 18,
    paddingVertical: 7,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  rarityText: { fontSize: 15, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" },
  legendary: { color: COLORS.gold, fontSize: 12, fontWeight: "900", letterSpacing: 2, marginTop: 10, textShadowColor: "rgba(245,197,66,.8)", textShadowRadius: 12 },
  name: { color: COLORS.cream, fontSize: 21, lineHeight: 25, fontWeight: "900", marginTop: 10, textAlign: "center", maxWidth: 300 },
  move: { color: COLORS.greenSoft, fontSize: 13, fontWeight: "800", marginTop: 6, textAlign: "center", maxWidth: 300 },
  charging: { color: COLORS.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 18, textTransform: "uppercase" },
  collect: { width: 220, marginTop: 18 },
});
