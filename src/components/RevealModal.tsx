import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, { Circle, Line, Path, Polygon } from "react-native-svg";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { FighterCard } from "./FighterCard";
import { CardItem } from "./CardItem";
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

function rarityRank(rarity: Rarity) {
  return Math.max(0, RARITY_ORDER.indexOf(rarity));
}
function chargeMs(rarity: Rarity, reduced: boolean) {
  if (reduced) return 120;
  return [460, 680, 980, 1360, 1850][rarityRank(rarity)] ?? 900;
}
const isHigh = (r: Rarity) => rarityRank(r) >= 3;
const isLeg = (r: Rarity) => rarityRank(r) >= 4;

function RevealSigil({ color, active }: { color: string; active: boolean }) {
  return (
    <Svg width="120" height="120" viewBox="0 0 118 118">
      <Circle cx="59" cy="59" r="52" fill="rgba(10,18,38,.62)" stroke={COLORS.gold} strokeWidth="1.6" />
      <Circle cx="59" cy="59" r="42" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeDasharray="6 7" opacity={active ? 0.9 : 0.5} />
      <Circle cx="59" cy="59" r="28" fill="rgba(255,61,180,.14)" stroke={color} strokeWidth="2" />
      <Polygon points="59,16 78,59 59,102 40,59" fill={active ? color : "rgba(255,61,180,.42)"} stroke="rgba(255,255,255,.56)" strokeWidth="1.4" />
      <Path d="M34 59h50M59 34v50" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <Circle cx="59" cy="59" r="10" fill={COLORS.accent} stroke="#ffffff" strokeWidth="1.5" />
      <Circle cx="63" cy="55" r="2.4" fill="#ffffff" opacity="0.92" />
    </Svg>
  );
}

// Faisca do impacto: explode do centro.
function Spark({ burst, angle, dist, size, color }: {
  burst: SharedValue<number>; angle: number; dist: number; size: number; color: string;
}) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const style = useAnimatedStyle(() => {
    const b = burst.value;
    return {
      opacity: b <= 0.02 ? 0 : Math.max(0, 1 - b) * 0.95,
      transform: [{ translateX: dx * dist * b }, { translateY: dy * dist * b }, { scale: 1 - b * 0.55 }],
    };
  });
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size, borderRadius: size, backgroundColor: color, shadowColor: color, shadowOpacity: 0.95, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, style]} />;
}

// Mote orbitando em elipse (perspectiva). layer decide se aparece na frente ou atras da carta.
function Mote({ orbit, reveal, phase, rx, ry, size, color, layer }: {
  orbit: SharedValue<number>; reveal: SharedValue<number>; phase: number; rx: number; ry: number; size: number; color: string; layer: "front" | "back";
}) {
  const style = useAnimatedStyle(() => {
    const a = orbit.value * Math.PI * 2 + phase;
    const depth = (Math.sin(a) + 1) / 2; // 0 atras .. 1 frente
    const inLayer = layer === "front" ? depth >= 0.5 : depth < 0.5;
    const vis = inLayer ? (0.18 + depth * 0.7) * Math.min(1, reveal.value * 1.4) : 0;
    return {
      opacity: vis,
      transform: [
        { translateX: Math.cos(a) * rx },
        { translateY: Math.sin(a) * ry },
        { scale: 0.45 + depth * 0.95 },
      ],
    };
  });
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size, borderRadius: size, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } }, style]} />;
}

export function RevealModal({ reveal, onClose }: { reveal: RevealTarget; onClose: () => void }) {
  console.log("[reveal] render", reveal?.kind);
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);

  const rarity: Rarity = reveal
    ? reveal.kind === "fighter"
      ? fighterRarity(reveal.data.bonus_intensidade ?? 1)
      : cardRarity(reveal.data.raridade ?? "")
    : "comum";

  const color = RARITY_COLORS[rarity];
  const label = RARITY_LABELS[rarity];
  const rank = rarityRank(rarity);
  const legendary = isLeg(rarity);
  const high = isHigh(rarity);
  const delay = chargeMs(rarity, reduced);

  const gate = useSharedValue(0);
  const card = useSharedValue(0);
  const burst = useSharedValue(0);
  const flash = useSharedValue(0);
  const idle = useSharedValue(0.5); // balanço 3D contínuo
  const orbit = useSharedValue(0); // motes
  const spin = useSharedValue(0); // anel parallax
  const pulse = useSharedValue(0);

  const hapticEvent = useMemo<HapticEvent>(() => (legendary ? "legendary" : high ? "reveal" : "success"), [high, legendary]);

  const sparks = useMemo(() => {
    const count = 8 + rank * 4;
    const palette = [COLORS.gold, COLORS.accent, COLORS.primary, "#ffffff"];
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + (i % 2 ? 0.2 : 0),
      dist: Math.max(width, height) * 0.26 * (0.7 + (i % 3) * 0.18),
      size: 3 + (i % 3),
      color: palette[i % palette.length],
    }));
  }, [rank, width, height]);

  const motes = useMemo(() => {
    const count = 6 + rank * 2;
    const palette = [COLORS.gold, COLORS.accent, COLORS.primary];
    return Array.from({ length: count }, (_, i) => ({
      phase: (i / count) * Math.PI * 2,
      rx: CARD_WIDTH * (0.62 + (i % 3) * 0.12),
      ry: 24 + (i % 4) * 8,
      size: 3 + (i % 3),
      color: palette[i % palette.length],
    }));
  }, [rank]);

  useEffect(() => {
    if (!reveal) return;
    setDone(false);
    gate.value = 0; card.value = 0; burst.value = 0; flash.value = 0;

    if (!reduced) {
      pulse.value = withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }), -1, true);
      idle.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
      orbit.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
      spin.value = withRepeat(withTiming(1, { duration: 26000, easing: Easing.linear }), -1, false);
    } else {
      pulse.value = 0.5; idle.value = 0.5; orbit.value = 0; spin.value = 0;
    }

    gate.value = withTiming(1, { duration: delay, easing: Easing.in(Easing.cubic) });
    card.value = withDelay(delay, withSpring(1, SPRING.settle));
    burst.value = withDelay(delay, withTiming(1, { duration: reduced ? 1 : 720, easing: Easing.out(Easing.cubic) }));
    if (high && !reduced) {
      flash.value = withDelay(delay, withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: legendary ? 560 : 320 })));
    }

    const timer = setTimeout(() => { fireHaptic(hapticEvent); setDone(true); }, delay + (reduced ? 60 : 320));
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, rarity, reduced]);

  const tilt = (v: number) => (v - 0.5) * 2; // -1..1

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: (0.28 + gate.value * 0.34 + pulse.value * 0.12),
    transform: [{ scale: 0.8 + gate.value * 0.4 + pulse.value * 0.08 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + gate.value * 0.22 + card.value * 0.1,
    transform: [{ rotate: `${spin.value * 360}deg` }, { scaleY: 0.42 }],
  }));
  const sigilStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - card.value * 1.4),
    transform: [{ scale: 0.7 + gate.value * 0.4 + pulse.value * 0.05 }, { rotate: `${spin.value * (220 + rank * 90)}deg` }],
  }));
  const lightStyle = useAnimatedStyle(() => {
    const b = burst.value, peak = Math.max(0, 1 - Math.abs(0.5 - b) * 2.2);
    return { opacity: reduced ? 0 : peak * (0.7 + rank * 0.06), transform: [{ scale: 0.4 + b * 2.0 }] };
  });
  const shockStyle = useAnimatedStyle(() => {
    const b = burst.value;
    return { opacity: reduced ? 0 : Math.max(0, 1 - b) * 0.7, transform: [{ scale: 0.3 + b * 2.6 }] };
  });
  const pedestalStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, card.value * 1.2),
    transform: [{ scaleY: 0.4 }, { scale: 0.7 + card.value * 0.35 }],
  }));
  const cardStyle = useAnimatedStyle(() => {
    const c = card.value, t = tilt(idle.value);
    return {
      opacity: Math.min(1, c * 1.3),
      transform: [
        { perspective: 1000 },
        { translateY: (1 - c) * 44 },
        { rotateY: `${(1 - c) * -100 + t * 13 * c}deg` },
        { rotateX: `${t * 4 * c}deg` },
        { scale: 0.62 + c * 0.38 },
      ],
    };
  });
  const specStyle = useAnimatedStyle(() => {
    const t = tilt(idle.value);
    return { opacity: reduced ? 0 : 0.18 + (t + 1) / 2 * 0.22, transform: [{ translateX: t * CARD_WIDTH * 0.5 }, { rotateZ: "16deg" }] };
  });
  const labelStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, (card.value - 0.4) / 0.6),
    transform: [{ translateY: (1 - card.value) * 16 }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  if (!reveal) return null;

  return (
    <View style={[StyleSheet.absoluteFill, s.root]} pointerEvents="auto">
        {reduced ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(6,12,26,.96)" }]} />
        ) : (
          <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill}>
            <LinearGradient colors={["rgba(8,14,30,.9)", "rgba(10,18,38,.84)", "rgba(6,12,26,.97)"]} style={StyleSheet.absoluteFill} />
          </BlurView>
        )}
        <Pressable style={StyleSheet.absoluteFill} disabled={!done} onPress={onClose} />

        {/* ----- CENA (altar) ----- */}
        <View pointerEvents="none" style={s.stage}>
          {/* glow ambiente volumetrico */}
          <Animated.View style={[s.ambient, { backgroundColor: color, shadowColor: color }, ambientStyle]} />
          {/* anel parallax achatado (chao do altar) */}
          <Animated.View style={[s.ringWrap, ringStyle]}>
            <Svg width={width * 0.9} height={width * 0.9} viewBox="0 0 300 300">
              <Circle cx="150" cy="150" r="140" stroke="rgba(245,197,66,.5)" strokeWidth="2" fill="none" />
              <Circle cx="150" cy="150" r="108" stroke="rgba(52,225,255,.4)" strokeWidth="1.5" fill="none" strokeDasharray="6 9" />
              <Circle cx="150" cy="150" r="70" stroke="rgba(255,61,180,.4)" strokeWidth="1.5" fill="none" strokeDasharray="3 11" />
            </Svg>
          </Animated.View>
          {/* sigilo de carga */}
          <Animated.View style={sigilStyle}><RevealSigil color={color} active={high} /></Animated.View>
          {/* impacto */}
          <Animated.View style={[s.lightBurst, { backgroundColor: legendary ? "#ffffff" : color, shadowColor: color }, lightStyle]} />
          <Animated.View style={[s.shock, { borderColor: color, shadowColor: color }, shockStyle]} />
          {!reduced ? sparks.map((sp, i) => <Spark key={i} burst={burst} {...sp} />) : null}
          {/* motes ATRAS da carta */}
          {!reduced ? motes.map((m, i) => <Mote key={`b${i}`} orbit={orbit} reveal={card} layer="back" {...m} />) : null}
        </View>

        {/* pedestal */}
        <Animated.View pointerEvents="none" style={[s.pedestal, { shadowColor: color, borderColor: color }, pedestalStyle]} />

        {/* flash */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: legendary ? "#ffffff" : color }, flashStyle]} />

        {/* carta girando em 3D */}
        <Animated.View style={[s.cardWrap, cardStyle]}>
          <View pointerEvents="none" style={[s.backLight, { borderColor: color, shadowColor: color }]} />
          <View style={s.cardHolder}>
            {reveal.kind === "fighter" ? (
              <FighterCard fighter={reveal.data} width={CARD_WIDTH} interactive />
            ) : (
              <CardItem card={reveal.data} width={CARD_WIDTH} interactive />
            )}
            <Animated.View pointerEvents="none" style={[s.spec, specStyle]}>
              <LinearGradient colors={["transparent", "rgba(255,255,255,.7)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
        </Animated.View>

        {/* motes NA FRENTE da carta */}
        <View pointerEvents="none" style={s.stage}>
          {!reduced ? motes.map((m, i) => <Mote key={`f${i}`} orbit={orbit} reveal={card} layer="front" {...m} />) : null}
        </View>

        {/* textos */}
        <Animated.View style={[s.labelWrap, labelStyle]}>
          <View style={[s.raritySeal, { borderColor: color, shadowColor: color }]}>
            <Text style={[s.rarityText, { color }]}>{label}</Text>
          </View>
          {legendary ? <Text style={s.legendary}>✦ JACKPOT ARCANO ✦</Text> : null}
          <Text style={s.name} numberOfLines={2}>
            {reveal.kind === "fighter" ? reveal.data.nome : reveal.data.nome_efeito}
          </Text>
          {reveal.kind === "fighter" && reveal.data.golpe ? <Text style={s.move} numberOfLines={1}>🎯 {reveal.data.golpe}</Text> : null}
          {done ? (
            <GameButton title="COLETAR" variant={legendary ? "gold" : high ? "primary" : "accent"} size="md" haptic="tap" shimmer={high} onPress={onClose} style={s.collect} />
          ) : (
            <Text style={s.charging}>canalizando raridade...</Text>
          )}
        </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", paddingHorizontal: 22, zIndex: 100, elevation: 100 },
  stage: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", marginTop: -46 },
  ambient: { position: "absolute", width: 320, height: 320, borderRadius: 160, opacity: 0.36, shadowOpacity: 0.9, shadowRadius: 64, shadowOffset: { width: 0, height: 0 } },
  ringWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  lightBurst: { position: "absolute", width: 220, height: 220, borderRadius: 110, shadowOpacity: 1, shadowRadius: 50, shadowOffset: { width: 0, height: 0 } },
  shock: { position: "absolute", width: 150, height: 150, borderRadius: 75, borderWidth: 3, shadowOpacity: 0.9, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  pedestal: {
    position: "absolute", alignSelf: "center", top: "54%", width: CARD_WIDTH + 70, height: CARD_WIDTH + 70,
    borderRadius: (CARD_WIDTH + 70) / 2, borderWidth: 2, backgroundColor: "rgba(255,61,180,.08)",
    shadowOpacity: 0.8, shadowRadius: 34, shadowOffset: { width: 0, height: 0 },
  },
  cardWrap: { alignItems: "center", justifyContent: "center", marginTop: -40 },
  backLight: { position: "absolute", width: CARD_WIDTH + 40, height: CARD_HEIGHT + 40, borderRadius: RADIUS.lg, borderWidth: 1, opacity: 0.5, shadowOpacity: 0.95, shadowRadius: 32, shadowOffset: { width: 0, height: 0 } },
  cardHolder: { width: CARD_WIDTH, borderRadius: RADIUS.md, overflow: "hidden" },
  spec: { position: "absolute", top: -50, bottom: -50, width: 90, left: -30 },
  labelWrap: { position: "absolute", bottom: 54, alignItems: "center", width: "100%" },
  raritySeal: { borderWidth: 1.5, borderRadius: RADIUS.round, backgroundColor: "rgba(6,12,26,.8)", paddingHorizontal: 18, paddingVertical: 7, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  rarityText: { fontSize: 15, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" },
  legendary: { color: COLORS.gold, fontSize: 12, fontWeight: "900", letterSpacing: 2, marginTop: 10, textShadowColor: "rgba(245,197,66,.8)", textShadowRadius: 12 },
  name: { color: COLORS.cream, fontSize: 21, lineHeight: 25, fontWeight: "900", marginTop: 10, textAlign: "center", maxWidth: 300 },
  move: { color: COLORS.greenSoft, fontSize: 13, fontWeight: "800", marginTop: 6, textAlign: "center", maxWidth: 300 },
  charging: { color: COLORS.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: 18, textTransform: "uppercase" },
  collect: { width: 220, marginTop: 18 },
});
