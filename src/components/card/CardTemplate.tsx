import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { rarityGlow, RARITY_COLORS, RARITY_LABELS, type Rarity } from "../../lib/rarityConfig";
import { COLORS, RADIUS } from "../../theme/tokens";
import { HoloCard } from "../motion/HoloCard";
import {
  CARD_ASPECT,
  CARD_HEIGHT,
  CARD_WIDTH,
  FRAME_INSET,
  cardFrameForRarity,
  isLegendaryRarity,
  isRenderableCardPhoto,
} from "./cardFrameConfig";

export type CardTemplateStat = {
  label: string;
  value: string | number;
  color: string;
};

export type CardTemplateProps = {
  width?: number;
  interactive?: boolean;
  rarity: Rarity;
  imageUri?: string | null;
  title: string;
  classLabel: string;
  classColor: string;
  placeholderIcon?: string | null;
  hpLabel: string;
  hpValue: string | number;
  hpColor?: string;
  powerLabel: string;
  powerColor: string;
  powerTextColor?: string;
  description: string;
  stats: CardTemplateStat[];
};

function TemplateStat({ label, value, color }: CardTemplateStat) {
  return (
    <View style={s.statBox}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={s.statLabel}>
        {label}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[s.statValue, { color }]}>
        {value}
      </Text>
    </View>
  );
}

export function CardTemplate({
  width = CARD_WIDTH,
  interactive = false,
  rarity,
  imageUri,
  title,
  classLabel,
  classColor,
  placeholderIcon,
  hpLabel,
  hpValue,
  hpColor,
  powerLabel,
  powerColor,
  powerTextColor = COLORS.cream,
  description,
  stats,
}: CardTemplateProps) {
  const height = Math.round(width * CARD_ASPECT);
  const rarityColor = RARITY_COLORS[rarity];
  const hasPhoto = isRenderableCardPhoto(imageUri);
  const isLegendary = isLegendaryRarity(rarity);

  const card = (
    <View style={[s.card, { width, height, shadowColor: rarityColor }, !isLegendary && rarityGlow(rarity)]}>
      <LinearGradient colors={["#02050d", COLORS.bgNav, "#02050d"]} style={StyleSheet.absoluteFill} />
      <View style={[s.outerGlow, { borderColor: rarityColor, shadowColor: rarityColor }]} />
      <Image source={cardFrameForRarity(rarity)} style={[s.frameImage, { width, height }]} resizeMode="stretch" />

      <View style={[s.artSlot, { left: width * 0.13, top: height * 0.245, width: width * 0.74, height: height * 0.315, borderColor: rarityColor }]}>
        {hasPhoto ? (
          <Image source={{ uri: imageUri ?? undefined }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[classColor + "44", COLORS.cardSurfaceDeep, COLORS.bgNav]} style={[StyleSheet.absoluteFill, s.placeholder]}>
            <Text style={[s.placeholderIcon, { color: classColor }]}>{placeholderIcon ?? "*"}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={["rgba(255,255,255,.18)", "transparent", "rgba(6,12,26,.56)"]} style={StyleSheet.absoluteFill} />
        <View style={[s.artInnerFrame, { borderColor: rarityColor }]} />
      </View>

      <View style={[s.titlePlate, { left: width * 0.13, top: height * 0.075, width: width * 0.74, height: height * 0.055 }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={s.title}>
          {title}
        </Text>
      </View>

      <View style={[s.classPlate, { left: width * 0.31, top: height * 0.155, width: width * 0.38, height: height * 0.036 }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[s.classText, { color: classColor }]}>
          {classLabel}
        </Text>
      </View>

      <View
        style={[
          s.hpOrb,
          { left: width * 0.085, top: height * 0.56, width: width * 0.18, height: width * 0.18, borderColor: rarityColor, shadowColor: rarityColor },
        ]}
      >
        <View style={s.hpInner}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={s.hpLabel}>
            {hpLabel}
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[s.hpValue, { color: hpColor ?? rarityColor }]}>
            {hpValue}
          </Text>
        </View>
      </View>

      <View style={[s.powerBar, { left: width * 0.31, top: height * 0.59, width: width * 0.56, height: height * 0.055 }]}>
        <View style={[s.powerFill, { backgroundColor: powerColor, shadowColor: powerColor }]} />
        <Text numberOfLines={1} adjustsFontSizeToFit style={[s.powerText, { color: powerTextColor }]}>
          {powerLabel}
        </Text>
      </View>

      <View style={[s.loreBox, { left: width * 0.14, top: height * 0.665, width: width * 0.72, height: height * 0.08 }]}>
        <Text numberOfLines={2} adjustsFontSizeToFit style={s.loreText}>
          {description}
        </Text>
      </View>

      <View style={[s.statsRow, { left: width * 0.12, top: height * 0.77, width: width * 0.76, height: height * 0.105 }]}>
        {stats.slice(0, 4).map((stat) => (
          <TemplateStat key={stat.label} {...stat} />
        ))}
      </View>

      <View style={[s.rarityPlate, { left: width * 0.22, bottom: height * 0.035, width: width * 0.56, height: height * 0.05 }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[s.rarityText, { color: rarityColor }]}>
          {RARITY_LABELS[rarity]}
        </Text>
      </View>
    </View>
  );

  if (!interactive) return card;

  return (
    <HoloCard width={width} height={height} rarity={rarity} interactive={false}>
      {card}
    </HoloCard>
  );
}

const s = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    shadowOpacity: 0.72,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  outerGlow: {
    position: "absolute",
    left: `${FRAME_INSET * 100}%`,
    right: `${FRAME_INSET * 100}%`,
    top: `${FRAME_INSET * 100}%`,
    bottom: `${FRAME_INSET * 100}%`,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    opacity: 0.58,
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },
  frameImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  artSlot: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 10,
    borderWidth: 1.2,
    backgroundColor: COLORS.cardSurfaceDeep,
  },
  artInnerFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "transparent",
    opacity: 0.85,
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 42,
    fontWeight: "900",
    textShadowColor: "rgba(255,255,255,.45)",
    textShadowRadius: 10,
  },
  titlePlate: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.cream,
    fontSize: 11.2,
    fontWeight: "900",
    letterSpacing: 0.36,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,.9)",
    textShadowRadius: 5,
  },
  classPlate: {
    position: "absolute",
    alignItems: "center",
  },
  classText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,.9)",
    textShadowRadius: 4,
  },
  hpOrb: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 2,
    backgroundColor: "rgba(2,5,12,.98)",
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 8,
  },
  hpInner: {
    width: "86%",
    height: "86%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(0,0,0,.76)",
  },
  hpLabel: {
    color: COLORS.textMuted,
    fontSize: 5.7,
    fontWeight: "900",
  },
  hpValue: {
    fontSize: 11,
    fontWeight: "900",
    marginTop: -1,
  },
  powerBar: {
    position: "absolute",
    justifyContent: "center",
  },
  powerFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.round,
    opacity: 0.78,
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  powerText: {
    fontSize: 7.2,
    fontWeight: "900",
    letterSpacing: 0.42,
    textAlign: "center",
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,.65)",
    textShadowRadius: 4,
  },
  statsRow: {
    position: "absolute",
    flexDirection: "row",
    gap: 3,
  },
  statBox: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.2)",
    backgroundColor: "rgba(2,5,12,.9)",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 5.8,
    fontWeight: "900",
  },
  statValue: {
    fontSize: 10.2,
    fontWeight: "900",
    marginTop: 1,
  },
  loreBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  loreText: {
    color: "rgba(234,242,255,.82)",
    fontSize: 7,
    fontWeight: "800",
    lineHeight: 8.8,
    textAlign: "center",
  },
  rarityPlate: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  rarityText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,.9)",
    textShadowRadius: 5,
  },
});
