/**
 * Cena de fundo "Arena de batalha" (Expo Go safe): ceu petroleo, glow radial
 * real do portal (SVG), runa magica girando, raios de energia e relampagos
 * crepitando. Da sensacao de combate arcano. Sem Skia.
 */
import { useEffect } from "react";
import { useWindowDimensions, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line, Polyline, Defs, RadialGradient as SvgRadial, Stop } from "react-native-svg";
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, withSequence, Easing,
} from "react-native-reanimated";
import { useReducedMotion } from "../../lib/useReducedMotion";

const SPARKS = [
  { x: 0.18, size: 3, delay: 0, dur: 6200, color: "#34e1ff" },
  { x: 0.32, size: 2, delay: 1800, dur: 7400, color: "#ff3db4" },
  { x: 0.46, size: 4, delay: 600, dur: 5600, color: "#f5c542" },
  { x: 0.6, size: 2, delay: 2600, dur: 8000, color: "#6c8cff" },
  { x: 0.72, size: 3, delay: 1200, dur: 6800, color: "#34e1ff" },
  { x: 0.84, size: 2, delay: 3200, dur: 7000, color: "#ff3db4" },
  { x: 0.26, size: 2, delay: 4000, dur: 7600, color: "#f5c542" },
  { x: 0.66, size: 3, delay: 5000, dur: 6000, color: "#34e1ff" },
];

function Spark({ x, size, delay, dur, color, width, height }: {
  x: number; size: number; delay: number; dur: number; color: string; width: number; height: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.linear }), -1, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -p.value * height * 0.85 }],
    opacity: Math.sin(p.value * Math.PI) * 0.9,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", left: x * width, bottom: height * 0.08, width: size, height: size, borderRadius: size, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
        style,
      ]}
    />
  );
}

/** Gera os pontos de um relampago jagged entre dois pontos. */
function bolt(x1: number, y1: number, x2: number, y2: number, segs: number, jitter: number) {
  const pts: string[] = [];
  for (let i = 0; i <= segs; i++) {
    const tt = i / segs;
    const x = x1 + (x2 - x1) * tt + (i === 0 || i === segs ? 0 : (Math.random() - 0.5) * jitter);
    const y = y1 + (y2 - y1) * tt;
    pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  return pts.join(" ");
}

function Lightning({ points, color, delay, width, height }: {
  points: string; color: string; delay: number; width: number; height: number;
}) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 2600 }),
          withTiming(1, { duration: 70 }),
          withTiming(0.2, { duration: 80 }),
          withTiming(0.9, { duration: 60 }),
          withTiming(0, { duration: 220 })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height}>
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
        <Polyline points={points} fill="none" stroke="#ffffff" strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}

export function ArenaBackground() {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const cx = width / 2;
  const cy = height * 0.38;

  const pulse = useSharedValue(0.5);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0.5;
      spin.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 38000, easing: Easing.linear }), -1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.55 + pulse.value * 0.35, transform: [{ scale: 0.94 + pulse.value * 0.1 }] }));
  const runeStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  // rune ring
  const D = width * 1.0;
  const rr = D / 2 - 6;
  const ticks = Array.from({ length: 16 }, (_, i) => i);

  // rays
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r0 = width * 0.32;
    const r1 = width * 0.62;
    return {
      x1: cx + Math.cos(a) * r0, y1: cy + Math.sin(a) * r0,
      x2: cx + Math.cos(a) * r1, y2: cy + Math.sin(a) * r1,
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ceu */}
      <LinearGradient colors={["#0c1630", "#122142", "#0a1226", "#060c1a"]} locations={[0, 0.42, 0.78, 1]} style={StyleSheet.absoluteFill} />

      {/* glow radial real (SVG) */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={width} height={height}>
          <Defs>
            <SvgRadial id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#ff3db4" stopOpacity="0.55" />
              <Stop offset="0.45" stopColor="#8b5cf6" stopOpacity="0.22" />
              <Stop offset="1" stopColor="#0a1226" stopOpacity="0" />
            </SvgRadial>
            <SvgRadial id="core" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#34e1ff" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#34e1ff" stopOpacity="0" />
            </SvgRadial>
          </Defs>
          <Circle cx={cx} cy={cy} r={width * 0.72} fill="url(#halo)" />
          <Circle cx={cx} cy={cy} r={width * 0.34} fill="url(#core)" />
        </Svg>
      </Animated.View>

      {/* raios de energia (estaticos, faint) */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {rays.map((r, i) => (
          <Line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="rgba(245,197,66,.12)" strokeWidth={1} />
        ))}
      </Svg>

      {/* runa magica girando */}
      <Animated.View style={[{ position: "absolute", left: cx - D / 2, top: cy - D / 2, width: D, height: D }, runeStyle]}>
        <Svg width={D} height={D}>
          <Circle cx={D / 2} cy={D / 2} r={rr} stroke="rgba(245,197,66,.4)" strokeWidth={1.5} fill="none" />
          <Circle cx={D / 2} cy={D / 2} r={rr - 16} stroke="rgba(52,225,255,.3)" strokeWidth={1} fill="none" strokeDasharray="6 10" />
          <Circle cx={D / 2} cy={D / 2} r={rr * 0.62} stroke="rgba(255,61,180,.25)" strokeWidth={1} fill="none" strokeDasharray="2 14" />
          {ticks.map((i) => {
            const a = (i / ticks.length) * Math.PI * 2;
            const inR = rr - 4;
            const outR = rr + 6;
            return (
              <Line
                key={i}
                x1={D / 2 + Math.cos(a) * inR} y1={D / 2 + Math.sin(a) * inR}
                x2={D / 2 + Math.cos(a) * outR} y2={D / 2 + Math.sin(a) * outR}
                stroke="rgba(245,197,66,.45)" strokeWidth={1.5}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* relampagos */}
      {!reduced ? (
        <>
          <Lightning points={bolt(cx - width * 0.28, cy - height * 0.22, cx - width * 0.08, cy, 6, 26)} color="#34e1ff" delay={500} width={width} height={height} />
          <Lightning points={bolt(cx + width * 0.3, cy - height * 0.16, cx + width * 0.06, cy + height * 0.04, 6, 28)} color="#ff3db4" delay={1900} width={width} height={height} />
          <Lightning points={bolt(cx + width * 0.02, cy - height * 0.3, cx - width * 0.02, cy - height * 0.02, 7, 22)} color="#f5c542" delay={3400} width={width} height={height} />
        </>
      ) : null}

      {/* faiscas */}
      {!reduced ? SPARKS.map((sp, i) => <Spark key={i} {...sp} width={width} height={height} />) : null}

      {/* vinheta */}
      <LinearGradient colors={["rgba(6,12,26,.82)", "rgba(6,12,26,0)"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: height * 0.26 }} />
      <LinearGradient colors={["rgba(6,12,26,0)", "rgba(6,12,26,.96)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.46 }} />
    </View>
  );
}
