import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";

const PORTAL_BG_VIDEO = require("../../../assets/videos/portal-bg.mp4");

export function PortalStageVideo() {
  const player = useVideoPlayer(PORTAL_BG_VIDEO, (videoPlayer) => {
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
      <LinearGradient
        colors={["rgba(6,12,26,.28)", "rgba(6,12,26,.02)", "rgba(6,12,26,.58)"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,61,180,.1)", "transparent", "rgba(52,225,255,.12)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.1 }],
  },
});
