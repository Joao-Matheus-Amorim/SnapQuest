/**
 * Botao "gordo" estilo arena premium: face com gradiente + gloss no topo,
 * ledge 3D (bevel) que afunda ao pressionar, halo colorido por variante,
 * e brilho idle (sheen) varrendo a face do botao principal.
 * Haptic + respeita reduced-motion.
 */
import { useEffect, useState } from "react";
import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, withDelay, Easing,
} from "react-native-reanimated";
import { fireHaptic, type HapticEvent } from "../../lib/haptics";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { SPRING } from "../../theme/tokens";

type Variant = "primary" | "gold" | "accent" | "green" | "dark";

const VARIANTS: Record<Variant, { face: [string, string]; edge: string; glow: string; text: string; border: string }> = {
  primary: { face: ["#ff63c8", "#e21a96"], edge: "#7c0c52", glow: "#ff3db4", text: "#fff0fa", border: "rgba(255,255,255,.4)" },
  gold: { face: ["#ffe48f", "#f3b50f"], edge: "#946a0a", glow: "#f5c542", text: "#2a1d02", border: "rgba(255,255,255,.5)" },
  accent: { face: ["#86f1ff", "#12bfe8"], edge: "#0a5f78", glow: "#34e1ff", text: "#042230", border: "rgba(255,255,255,.5)" },
  green: { face: ["#43e0a0", "#0fae72"], edge: "#0a5c40", glow: "#22c55e", text: "#052018", border: "rgba(255,255,255,.45)" },
  dark: { face: ["#1c2c56", "#0f1c3a"], edge: "#070d1c", glow: "#6c8cff", text: "#eaf2ff", border: "rgba(108,140,255,.4)" },
};

const EDGE = 6;
const RADIUS = 18;

type Props = {
  title: string;
  subtitle?: string;
  icon?: string;
  variant?: Variant;
  size?: "lg" | "md";
  disabled?: boolean;
  haptic?: HapticEvent;
  shimmer?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function GameButton({
  title, subtitle, icon, variant = "primary", size = "lg",
  disabled = false, haptic = "tap", shimmer, onPress, style,
}: Props) {
  const reduced = useReducedMotion();
  const v = VARIANTS[variant];
  const ty = useSharedValue(0);
  const [w, setW] = useState(0);
  const sheen = useSharedValue(-1);

  const idleShimmer = (shimmer ?? variant === "primary") && !disabled && !reduced;

  useEffect(() => {
    if (idleShimmer && w > 0) {
      sheen.value = -1;
      sheen.value = withRepeat(
        withDelay(900, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })),
        -1,
        false
      );
    } else {
      sheen.value = -1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleShimmer, w]);

  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sheen.value * (w + 120) }, { rotateZ: "18deg" }],
    opacity: sheen.value > -0.9 && sheen.value < 0.9 ? 0.5 : 0,
  }));

  const faceH = size === "lg" ? 64 : 52;

  return (
    <View style={[{ height: faceH + EDGE }, style]}>
      {!disabled ? <View style={[styles.halo, { shadowColor: v.glow }]} /> : null}
      <View style={[styles.edge, { backgroundColor: disabled ? "#1a1530" : v.edge }]} />
      <Animated.View style={[styles.faceWrap, { height: faceH }, faceStyle]}>
        <Pressable
          disabled={disabled}
          onPress={onPress}
          onLayout={(e) => setW(e.nativeEvent.layout.width)}
          onPressIn={() => {
            if (disabled) return;
            fireHaptic(haptic);
            ty.value = reduced ? EDGE : withTiming(EDGE, { duration: 70 });
          }}
          onPressOut={() => {
            ty.value = reduced ? 0 : withSpring(0, SPRING.press);
          }}
          style={styles.press}
        >
          <LinearGradient
            colors={disabled ? ["#2c2746", "#1a1530"] : v.face}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.face, { borderColor: disabled ? "rgba(255,255,255,.12)" : v.border }]}
          >
            {/* gloss superior */}
            <LinearGradient
              colors={["rgba(255,255,255,.5)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gloss}
              pointerEvents="none"
            />
            {/* sheen idle */}
            {idleShimmer ? (
              <Animated.View style={[styles.sheen, sheenStyle]} pointerEvents="none">
                <LinearGradient
                  colors={["rgba(255,255,255,0)", "rgba(255,255,255,.85)", "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            ) : null}
            <View style={styles.content}>
              {icon ? <Text style={styles.icon}>{icon}</Text> : null}
              <View style={{ flex: subtitle ? 1 : 0 }}>
                <Text style={[styles.title, { color: disabled ? "rgba(255,255,255,.55)" : v.text }, size === "md" && styles.titleMd]} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: disabled ? "rgba(255,255,255,.4)" : v.text }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { ...StyleSheet.absoluteFillObject, borderRadius: RADIUS, shadowOpacity: 0.85, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  edge: { position: "absolute", left: 0, right: 0, bottom: 0, top: EDGE, borderRadius: RADIUS },
  faceWrap: { position: "absolute", left: 0, right: 0, top: 0 },
  press: { flex: 1 },
  face: { flex: 1, borderRadius: RADIUS, overflow: "hidden", paddingHorizontal: 18, justifyContent: "center", borderWidth: 1.5 },
  gloss: { position: "absolute", left: 0, right: 0, top: 0, height: "52%", borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS },
  sheen: { position: "absolute", top: -40, bottom: -40, width: 70, left: -60 },
  content: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { fontSize: 26 },
  title: { fontSize: 21, fontWeight: "900", letterSpacing: 0.5 },
  titleMd: { fontSize: 16 },
  subtitle: { fontSize: 12, fontWeight: "800", opacity: 0.85, marginTop: 1 },
});
