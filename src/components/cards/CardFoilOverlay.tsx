/**
 * CardFoilOverlay — foil holográfico premium, SÓ para épico/lendário.
 * Banda prismática que varre a carta em loop (Reanimated). Opacidade baixa:
 * não cobre arte nem esconde atributos. Respeita "reduzir movimento".
 */
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "../../lib/useReducedMotion";

const PRISMATIC = ["transparent", "#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#b15dff", "transparent"] as const;
const GOLD = ["transparent", "#fff3c4", "#ffd166", "#fff7e0", "#f5c542", "transparent"] as const;

type Props = {
  width: number;
  height: number;
  /** "epic" usa foil prismático/roxo, "legendary" dourado/prismático. */
  variant: "epic" | "legendary";
  radius?: number;
};

export function CardFoilOverlay({ width, height, variant, radius = 12 }: Props) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  const sweepMs = variant === "legendary" ? 1500 : 2000;

  useEffect(() => {
    if (reduced) return;
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: sweepMs, easing: Easing.linear }), -1, false);
  }, [reduced, sweepMs, t]);

  const bandW = width * 1.5;
  const travel = width + bandW;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -bandW + t.value * travel }, { rotateZ: "18deg" }],
  }));

  const colors = variant === "legendary" ? GOLD : PRISMATIC;
  const opacity = variant === "legendary" ? 0.26 : 0.2;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: "hidden" }]}>
      <Animated.View
        style={[{ position: "absolute", top: -height * 0.6, height: height * 2.2, width: bandW }, style]}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { opacity }]} />
      </Animated.View>
    </View>
  );
}
