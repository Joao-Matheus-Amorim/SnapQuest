/**
 * CardArt — arte/foto encaixada na janela central do template.
 * Recorta dentro da artArea; foto cobre (cover) sem distorcer. Sem foto → placeholder.
 */
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../theme/tokens";
import { isRenderableCardPhoto } from "../../utils/cardMeta";
import { zoneStyle, CARD_LAYOUT } from "../../utils/cardLayout";
import { CardIcon } from "./CardIcon";
import type { CardIconName } from "../../types/card";

type Props = {
  width: number;
  height: number;
  image?: string | null;
  placeholderIcon?: CardIconName;
  tint: string;
};

export function CardArt({ width, height, image, placeholderIcon = "aura", tint }: Props) {
  const hasPhoto = isRenderableCardPhoto(image);
  const zone = zoneStyle(CARD_LAYOUT.artArea, width, height);

  return (
    <View style={[zone, styles.clip]}>
      {hasPhoto ? (
        <Image source={{ uri: image ?? undefined }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[tint + "44", COLORS.cardSurfaceDeep, COLORS.bgNav]}
          style={[StyleSheet.absoluteFill, styles.center]}
        >
          <CardIcon name={placeholderIcon} size={width * 0.26} color={tint} opacity={0.85} />
        </LinearGradient>
      )}
      {/* wash MÍNIMO: preserva a foto real/ao vivo; só leve sombra na base
          para integrar à moldura sem clarear nem estilizar a imagem. */}
      {hasPhoto ? (
        <LinearGradient
          colors={["transparent", "transparent", "rgba(6,12,26,.26)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden", borderRadius: 6, backgroundColor: COLORS.cardSurfaceDeep },
  center: { alignItems: "center", justifyContent: "center" },
});
