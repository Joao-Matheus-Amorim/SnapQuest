/**
 * CardFooter — rótulo de raridade no plate inferior do template.
 */
import React from "react";
import { Text, StyleSheet } from "react-native";
import { FONTS } from "../../theme/fonts";
import { zoneStyle, CARD_LAYOUT } from "../../utils/cardLayout";

type Props = {
  width: number;
  height: number;
  label: string;
  color: string;
};

export function CardFooter({ width, height, label, color }: Props) {
  const zone = zoneStyle(CARD_LAYOUT.footerArea, width, height);
  const fontSize = Math.max(7, Math.round(width * 0.05));

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={[zone, styles.label, { fontSize, color, textShadowColor: color + "99" }]}
      pointerEvents="none"
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.cinzelBold,
    letterSpacing: 1.4,
    textAlign: "center",
    textAlignVertical: "center",
    textTransform: "uppercase",
    textShadowRadius: 4,
  },
});
