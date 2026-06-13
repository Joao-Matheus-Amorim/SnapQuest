/**
 * Cena de fundo "Arena de batalha" (Expo Go safe): usa a ARTE como base
 * (assets/arena/arena-bg.png) encaixada INTEIRA (contain) e centralizada, com
 * fundo escuro nas bordas. Anima por cima — brilho pulsante no circulo magico,
 * shimmer girando sobre as runas e faiscas subindo dos 4 cristais (magenta no
 * topo = inimigo, ciano embaixo = jogador). Sem Skia. Overlays ancorados no
 * retangulo real da imagem para baterem com a arte em qualquer tela.
 */
import { useEffect } from "react";
import { useWindowDimensions, StyleSheet, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient as SvgRadial, Stop } from "react-native-svg";
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming, withDelay, Easing,
} from "react-native-reanimated";
import { useReducedMotion } from "../../lib/useReducedMotion";

const ARENA_IMG = require("../../../assets/arena/arena-bg.png");
const IMG_W = 941;
const IMG_H = 1672;

// Posicoes na ARTE (proporcao da imagem, nao da tela).
const CORE = { x: 0.5, y: 0.45 };
const CRYSTALS = [
  { x: 0.10, y: 0.17, color: "#ff3db4" },
  { x: 0.90, y: 0.17, color: "#ff3db4" },
  { x: 0.10, y: 0.80, color: "#34e1ff" },
  { x: 0.90, y: 0.80, color: "#34e1ff" },
];

function Spark({ left, top, size, delay, dur, color, rise, drift }: {
  left: number; top: number; size: number; delay: number; dur: number; color: string; rise: number; drift: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.linear }), -1, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -p.value * rise }, { translateX: Math.sin(p.value * Math.PI * 2) * drift }],
    opacity: Math.sin(p.value * Math.PI) * 0.9,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", left, top, width: size, height: size, borderRadius: size, backgroundColor: color, shadowColor: color, shadowOpacity: 0.95, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
        style,
      ]}
    />
  );
}

export function ArenaBackground() {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();

  // CONTAIN: maior escala que cabe inteiro, centralizado.
  const scale = Math.min(width / IMG_W, height / IMG_H);
  const imgW = IMG_W * scale;
  const imgH = IMG_H * scale;
  const imgLeft = (width - imgW) / 2;
  const imgTop = (height - imgH) / 2;
  const sx = (ix: number) => imgLeft + ix * imgW;
  const sy = (iy: number) => imgTop + iy * imgH;

  const cx = sx(CORE.x);
  const cy = sy(CORE.y);

  const pulse = useSharedValue(0.5);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0.5;
      spin.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 46000, easing: Easing.linear }), -1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.4 + pulse.value * 0.45, transform: [{ scale: 0.92 + pulse.value * 0.12 }] }));
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: 0.22 + pulse.value * 0.18, transform: [{ rotate: `${spin.value * 360}deg` }] }));

  // Anel de shimmer sobre as runas, do tamanho do circulo na arte.
  const D = imgW * 0.86;
  const rr = D / 2 - 6;

  const sparks = CRYSTALS.flatMap((c, ci) =>
    [0, 1, 2].map((j) => ({
      key: `${ci}-${j}`,
      left: sx(c.x) + (j - 1) * (imgW * 0.014),
      top: sy(c.y),
      color: c.color,
      size: 2 + (j % 2),
      delay: ci * 650 + j * 900,
      dur: 4200 + j * 700,
      rise: imgH * 0.12,
      drift: 5 + j * 2,
    }))
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#070b18" }]} pointerEvents="none">
      {/* base: a arte inteira, centralizada */}
      <Image source={ARENA_IMG} style={{ position: "absolute", left: imgLeft, top: imgTop, width: imgW, height: imgH }} resizeMode="cover" />

      {/* brilho pulsante no circulo magico central */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={width} height={height}>
          <Defs>
            <SvgRadial id="arenaCore" cx={cx} cy={cy} r={imgW * 0.5} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#34e1ff" stopOpacity="0.5" />
              <Stop offset="0.55" stopColor="#3aa0ff" stopOpacity="0.18" />
              <Stop offset="1" stopColor="#34e1ff" stopOpacity="0" />
            </SvgRadial>
          </Defs>
          <Circle cx={cx} cy={cy} r={imgW * 0.5} fill="url(#arenaCore)" />
        </Svg>
      </Animated.View>

      {/* shimmer de runa girando sobre o circulo */}
      {!reduced ? (
        <Animated.View style={[{ position: "absolute", left: cx - D / 2, top: cy - D / 2, width: D, height: D }, shimmerStyle]}>
          <Svg width={D} height={D}>
            <Circle cx={D / 2} cy={D / 2} r={rr} stroke="rgba(52,225,255,.5)" strokeWidth={1.5} fill="none" strokeDasharray="3 16" />
            <Circle cx={D / 2} cy={D / 2} r={rr * 0.72} stroke="rgba(120,180,255,.4)" strokeWidth={1} fill="none" strokeDasharray="2 18" />
          </Svg>
        </Animated.View>
      ) : null}

      {/* faiscas dos cristais */}
      {!reduced ? sparks.map(({ key, ...sp }) => <Spark key={key} {...sp} />) : null}

      {/* leve scrim para assentar a UI sem apagar a arte */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(6,12,26,.12)" }]} />
      <LinearGradient colors={["rgba(6,12,26,0)", "rgba(7,11,24,.65)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: height * 0.22 }} />
    </View>
  );
}
