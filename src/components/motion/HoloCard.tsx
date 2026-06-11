/**
 * HoloCard — materialidade de carta colecionavel (compativel com Expo Go).
 * - Foil holografico: banda de gradiente que varre a carta (expo-linear-gradient
 *   + Reanimated), gated por raridade.
 * - Tilt/parallax 3D por gesto quando interactive=true (telas sem scroll).
 * - Respeita "Reduzir movimento" e degrada em web.
 *
 * (Versao Skia fica para quando houver dev build; aqui priorizamos rodar no Expo Go.)
 */
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { Rarity } from "../../lib/rarityConfig";
import { rarityEffect, SPRING } from "../../theme/tokens";
import { useReducedMotion } from "../../lib/useReducedMotion";

const HOLO = ["transparent", "#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#b15dff", "transparent"] as const;

type Props = {
  width: number;
  height: number;
  rarity: Rarity;
  radius?: number;
  interactive?: boolean;
  children: React.ReactNode;
};

export function HoloCard({ width, height, rarity, radius = 8, interactive = false, children }: Props) {
  const reduced = useReducedMotion();
  const eff = rarityEffect(rarity);
  const foilOn = eff.foil && !reduced;
  const tiltOn = interactive && !reduced;

  const rotX = useSharedValue(0);
  const rotY = useSharedValue(0);
  const t = useSharedValue(0);

  useEffect(() => {
    if (foilOn) {
      t.value = 0;
      t.value = withRepeat(withTiming(1, { duration: eff.sweepMs || 2200, easing: Easing.linear }), -1, false);
    } else {
      t.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foilOn, eff.sweepMs]);

  const pan = Gesture.Pan()
    .enabled(tiltOn)
    .onUpdate((e) => {
      "worklet";
      const nx = Math.max(0, Math.min(1, e.x / width));
      const ny = Math.max(0, Math.min(1, e.y / height));
      rotY.value = (nx - 0.5) * 2 * eff.tiltMax;
      rotX.value = -(ny - 0.5) * 2 * eff.tiltMax;
    })
    .onFinalize(() => {
      "worklet";
      rotX.value = withSpring(0, SPRING.tilt);
      rotY.value = withSpring(0, SPRING.tilt);
    });

  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rotX.value}deg` },
      { rotateY: `${rotY.value}deg` },
    ],
  }));

  // Banda de foil varrendo na diagonal.
  const bandW = width * 1.6;
  const travel = width + bandW;
  const foilStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -bandW + t.value * travel + (rotY.value / eff.tiltMax || 0) * 18 },
      { rotateZ: "18deg" },
    ],
  }));

  const inner = (
    <Animated.View style={[{ width, height }, tiltStyle]}>
      {children}
      {foilOn ? (
        <View
          style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: "hidden" }]}
          pointerEvents="none"
        >
          <Animated.View
            style={[
              { position: "absolute", top: -height * 0.6, height: height * 2.2, width: bandW },
              foilStyle,
            ]}
          >
            <LinearGradient
              colors={HOLO}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { opacity: rarity === "lendário" ? 0.32 : 0.22 }]}
            />
          </Animated.View>
        </View>
      ) : null}
    </Animated.View>
  );

  if (tiltOn) {
    return <GestureDetector gesture={pan}>{inner}</GestureDetector>;
  }
  return <View style={{ width, height }}>{inner}</View>;
}
