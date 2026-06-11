import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import Svg, { Polyline } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { COLORS } from "../../theme/tokens";

const SNAPQUEST_BG_VIDEO = require("../../../assets/videos/snapquest-bg.mp4");

function lightningPath(points: Array<[number, number]>, width: number, height: number) {
  return points.map(([x, y]) => `${Math.round(x * width)},${Math.round(y * height)}`).join(" ");
}

function LightningBolt({ points, color, delay }: { points: Array<[number, number]>; color: string; delay: number }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      opacity.value = 0;
      return;
    }

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1800, easing: Easing.linear }),
          withTiming(1, { duration: 90 }),
          withTiming(0.28, { duration: 90 }),
          withTiming(0.95, { duration: 80 }),
          withTiming(0.18, { duration: 420 }),
          withTiming(0, { duration: 360 })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const style = useAnimatedStyle(() => ({ opacity: Math.max(0.14, opacity.value) }));
  const path = lightningPath(points, width, height);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={width} height={height}>
        <Polyline points={path} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" opacity={0.18} />
        <Polyline points={path} fill="none" stroke={color} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" opacity={0.34} />
        <Polyline points={path} fill="none" stroke="#ffffff" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" opacity={0.92} />
      </Svg>
    </Animated.View>
  );
}

export function VideoBackground() {
  const player = useVideoPlayer(SNAPQUEST_BG_VIDEO, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.volume = 0;
    videoPlayer.play();
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        allowsFullscreen={false}
        surfaceType="textureView"
        style={styles.video}
      />
      <View style={styles.tint} />
      <LinearGradient
        colors={["rgba(6,12,26,.28)", "rgba(6,12,26,.04)", "rgba(6,12,26,.54)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,61,180,.09)", "transparent", "rgba(52,225,255,.06)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.lightningLayer}>
        <LightningBolt
          color={COLORS.accent}
          delay={520}
          points={[
            [0.18, 0.02],
            [0.34, 0.11],
            [0.27, 0.19],
            [0.48, 0.29],
            [0.39, 0.39],
          ]}
        />
        <LightningBolt
          color={COLORS.primary}
          delay={2100}
          points={[
            [0.82, 0.0],
            [0.68, 0.1],
            [0.75, 0.18],
            [0.55, 0.29],
            [0.63, 0.39],
          ]}
        />
        <LightningBolt
          color={COLORS.gold}
          delay={3550}
          points={[
            [0.5, 0.03],
            [0.46, 0.12],
            [0.54, 0.19],
            [0.47, 0.3],
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.18 }],
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgNav,
    opacity: 0.08,
  },
  lightningLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
});
