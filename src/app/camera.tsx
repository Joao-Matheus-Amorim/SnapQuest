import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Platform, View, Text, StyleSheet, Image, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon } from "react-native-svg";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useCapturedPhotos } from "../hooks/useCapturedPhotos";
import { useAuth } from "../hooks/useAuth";
import { ArenaBackground } from "../components/game/ArenaBackground";
import { GameButton } from "../components/game/GameButton";
import { PortalStageVideo } from "../components/game/PortalStageVideo";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { PressableScale } from "../components/motion/PressableScale";
import { isRenderableCaptureUri, tryResolveGalleryAssetUri, writeReadableGalleryCopy } from "../lib/capturePhotoSource";
import { useReducedMotion } from "../lib/useReducedMotion";
import { COLORS, RADIUS } from "../theme/tokens";

function PortalCore({ active, disabled, onPress }: { active: boolean; disabled: boolean; onPress: () => void }) {
  const reduced = useReducedMotion();
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    if (reduced) {
      spin.value = 0;
      pulse.value = active ? 1 : 0.55;
      return;
    }

    spin.value = withRepeat(withTiming(1, { duration: 22000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(active ? 1 : 0.72, { duration: active ? 900 : 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + pulse.value * 0.28,
    transform: [{ scale: 0.96 + pulse.value * 0.05 }],
  }));

  const ticks = Array.from({ length: 18 }, (_, i) => i);

  return (
    <View style={styles.portalCore}>
      <Animated.View pointerEvents="none" style={[styles.portalAura, coreStyle]} />
      <Animated.View pointerEvents="none" style={[styles.portalRing, ringStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 220 220">
          <Circle cx="110" cy="110" r="96" stroke="rgba(245,197,66,.54)" strokeWidth="2" fill="none" />
          <Circle cx="110" cy="110" r="75" stroke="rgba(52,225,255,.36)" strokeWidth="1.5" fill="none" strokeDasharray="7 10" />
          <Circle cx="110" cy="110" r="46" stroke="rgba(255,61,180,.32)" strokeWidth="1.5" fill="none" strokeDasharray="3 11" />
          {ticks.map((i) => {
            const angle = (i / ticks.length) * Math.PI * 2;
            const x1 = 110 + Math.cos(angle) * 84;
            const y1 = 110 + Math.sin(angle) * 84;
            const x2 = 110 + Math.cos(angle) * 103;
            const y2 = 110 + Math.sin(angle) * 103;
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(234,242,255,.42)" strokeWidth="1.2" />;
          })}
        </Svg>
      </Animated.View>
      <View style={styles.aperture}>
        <LinearGradient
          colors={active ? ["#ffffff", COLORS.accent, COLORS.primary] : [COLORS.cardSurface, COLORS.panelHero, COLORS.bgDeep]}
          start={{ x: 0.25, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.apertureCut} />
        <PressableScale
          style={styles.sigilButton}
          onPress={onPress}
          disabled={disabled}
          haptic="select"
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel="Capturar essencia"
        >
          <PortalSigil active={active} />
        </PressableScale>
      </View>
      <View style={styles.portalBase}>
        <View style={styles.portalBaseLight} />
      </View>
    </View>
  );
}

function PortalSigil({ active }: { active: boolean }) {
  return (
    <View style={styles.sigil}>
      <Svg width="72" height="72" viewBox="0 0 72 72">
        <Circle cx="36" cy="36" r="31" fill={active ? "rgba(255,61,180,.3)" : "rgba(10,18,38,.72)"} stroke={COLORS.gold} strokeWidth="1.4" />
        <Circle cx="36" cy="36" r="26" fill="rgba(10,18,38,.68)" stroke={COLORS.accent} strokeWidth="2.2" strokeDasharray="4 5" opacity={active ? 1 : 0.72} />
        <Circle cx="36" cy="36" r="18" fill="rgba(255,61,180,.18)" stroke={COLORS.primary} strokeWidth="1.6" opacity={active ? 1 : 0.82} />
        <Polygon points="36,7 49,36 36,65 23,36" fill={active ? COLORS.primary : "rgba(255,61,180,.68)"} stroke={COLORS.gold} strokeWidth="1.7" />
        <Polygon points="36,14 44,36 36,58 28,36" fill="rgba(52,225,255,.62)" stroke="rgba(255,255,255,.58)" strokeWidth="1.2" />
        <Path d="M23.5 35.5h25v13.5h-25z" fill="rgba(6,12,26,.94)" stroke={COLORS.gold} strokeWidth="1.8" strokeLinejoin="round" />
        <Path d="M29 35.5l3.6-6.2h6.8l3.6 6.2" fill="none" stroke={COLORS.gold} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="36" cy="42" r="6.2" fill={COLORS.accent} stroke="#ffffff" strokeWidth="1.4" />
        <Circle cx="38.5" cy="39.5" r="1.7" fill="#ffffff" opacity="0.92" />
        <Path d="M15 24l8.5 2-7 5.5M57 24l-8.5 2 7 5.5" fill="none" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : 0.72} />
        <Path d="M20 55l9-4M52 55l-9-4M20 17l9 4M52 17l-9 4" fill="none" stroke={COLORS.primary} strokeWidth="1.8" strokeLinecap="round" opacity="0.82" />
      </Svg>
    </View>
  );
}

export default function CameraScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addCapturedPhoto } = useCapturedPhotos();
  const { canManageCatalog } = useAuth();
  const ownerMode = canManageCatalog;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissao necessaria", "Autorize o acesso a camera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    await saveCapture(result.assets[0].uri, result.assets[0].assetId ?? undefined, result.assets[0].fileName ?? undefined, "camera");
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissao necessaria", "Autorize o acesso a galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.9,
      mediaTypes: ["images"],
      base64: Platform.OS !== "web",
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const uri = isRenderableCaptureUri(asset.uri) ? asset.uri : null;
    if (!uri) {
      Alert.alert("Foto invalida", "Selecione uma foto da galeria.");
      return;
    }
    await saveCapture(uri, asset.assetId ?? undefined, asset.fileName ?? undefined, "gallery", asset.base64 ?? undefined);
  }

  async function saveCapture(
    capturedUri: string,
    assetId: string | undefined,
    filename: string | undefined,
    source: "camera" | "gallery",
    pickedBase64?: string
  ) {
    setIsSaving(true);
    try {
      let savedUri = capturedUri;

      if (Platform.OS !== "web" && source === "camera") {
        try {
          const mediaResult = await Promise.race([
            (async () => {
              const perm = await MediaLibrary.requestPermissionsAsync();
              if (!perm.granted) return null;
              const asset = await MediaLibrary.createAssetAsync(capturedUri);
              // Não usamos asset.localUri — é o caminho /DCIM/ que o Expo Go
              // não tem permissão de ler. O capturedUri (temp do container) é
              // acessível e será copiado pro Documents em persistPhoto.
              return { assetId: asset.id, filename: asset.filename };
            })(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
          ]);
          if (mediaResult) {
            assetId = mediaResult.assetId;
            filename = mediaResult.filename;
            // savedUri continua como capturedUri
          } else if (!isRenderableCaptureUri(savedUri)) {
            Alert.alert("Nao foi possivel salvar", "O iOS nao liberou o arquivo. Tente novamente.");
            return;
          }
        } catch {
          // fallback: capturedUri
        }
      }

      if (Platform.OS !== "web" && source === "gallery") {
        const readableCopy = await writeReadableGalleryCopy(pickedBase64, assetId, filename);
        if (readableCopy) {
          savedUri = readableCopy;
        } else {
          const resolvedGalleryAsset = await tryResolveGalleryAssetUri(assetId, capturedUri);
          if (resolvedGalleryAsset) {
            assetId = resolvedGalleryAsset.assetId;
            filename = resolvedGalleryAsset.filename;
            savedUri = resolvedGalleryAsset.savedUri;
          }
        }
      }

      await addCapturedPhoto({ uri: savedUri, assetId, filename, source });
      setImageUri(savedUri);
      setTimeout(() => router.replace("/inventory"), 800);
    } catch {
      Alert.alert("Erro ao salvar", "Verifique as permissoes e tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ArenaBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(440).springify().damping(16)} style={styles.header}>
          <Text style={styles.realm}>PORTAL DE CAPTURA</Text>
          <Text style={styles.title}>Abra a fenda. Capture poder.</Text>
          <Text style={styles.subtitle}>
            {ownerMode
              ? "Camera forja seu deck. Galeria alimenta o catalogo base."
              : "Capture uma foto e revele Fighter ou Carta no Grimorio."}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(520).springify().damping(15)} style={styles.portalStage}>
          <PortalStageVideo />

          <View style={styles.stageCrown}>
            <View style={styles.crownChip}><Text style={styles.crownText}>RITUAL</Text></View>
            <View style={styles.crownLine} />
            <View style={styles.crownChip}><Text style={styles.crownText}>{ownerMode ? "MESTRE" : "JOGADOR"}</Text></View>
          </View>

          <PortalCore active={isSaving || Boolean(imageUri)} disabled={isSaving} onPress={pickFromCamera} />

          <View style={styles.runeRow}>
            <View style={styles.runeBadge}><Text style={styles.runeText}>ANALISE</Text></View>
            <View style={styles.runeBadge}><Text style={styles.runeText}>RARIDADE</Text></View>
            <View style={styles.runeBadge}><Text style={styles.runeText}>DUELO</Text></View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(520).springify().damping(16)} style={styles.actions}>
          {ownerMode ? (
            <GameButton
              title="IMPORTAR CATALOGO"
              subtitle="Galeria do mestre"
              variant="gold"
              size="md"
              haptic="tap"
              disabled={isSaving}
              shimmer={false}
              onPress={pickFromGallery}
            />
          ) : null}
        </Animated.View>
      </ScrollView>

      {imageUri && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.successBox}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <View style={styles.successPlate}>
            {isSaving ? <ActivityIndicator color={COLORS.accent} size="small" /> : null}
            <Text style={styles.success}>Foto capturada. Abrindo Grimorio...</Text>
          </View>
        </Animated.View>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgNav,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: BOTTOM_NAV_HEIGHT + 12,
    gap: 18,
  },
  header: {
    width: "100%",
    maxWidth: 390,
    alignItems: "center",
  },
  realm: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
    textShadowColor: "rgba(245,197,66,.62)",
    textShadowRadius: 12,
  },
  title: {
    color: COLORS.cream,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
    textShadowColor: "rgba(255,61,180,.65)",
    textShadowRadius: 16,
  },
  subtitle: {
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 330,
  },
  portalStage: {
    width: "100%",
    maxWidth: 390,
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(52,225,255,.18)",
    backgroundColor: "rgba(10,18,38,.42)",
    overflow: "hidden",
    paddingVertical: 18,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  stageCrown: {
    position: "absolute",
    top: 12,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  crownChip: {
    height: 22,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.36)",
    backgroundColor: "rgba(6,12,26,.72)",
  },
  crownText: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  crownLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(52,225,255,.28)",
  },
  portalCore: {
    width: 250,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  portalAura: {
    position: "absolute",
    width: 228,
    height: 228,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(52,225,255,.24)",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.8,
    shadowRadius: 32,
  },
  portalRing: {
    position: "absolute",
    width: 220,
    height: 220,
  },
  aperture: {
    width: 112,
    height: 112,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,.48)",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.88,
    shadowRadius: 24,
    elevation: 12,
  },
  apertureCut: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(6,12,26,.72)",
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.16)",
  },
  sigil: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  sigilButton: {
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
  },
  portalBase: {
    position: "absolute",
    bottom: 10,
    width: 176,
    height: 28,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(6,12,26,.86)",
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.14)",
  },
  portalBaseLight: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 7,
    height: 3,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.accent,
  },
  runeRow: {
    position: "absolute",
    bottom: 18,
    flexDirection: "row",
    gap: 8,
  },
  runeBadge: {
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.14)",
    borderRadius: RADIUS.round,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(6,12,26,.66)",
  },
  runeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  actions: {
    width: "100%",
    maxWidth: 360,
    gap: 12,
  },
  successBox: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: BOTTOM_NAV_HEIGHT + 18,
    alignItems: "center",
    gap: 8,
  },
  preview: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  successPlate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.38)",
    backgroundColor: "rgba(6,12,26,.84)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  success: { color: COLORS.gold, fontWeight: "900", fontSize: 13 },
});
