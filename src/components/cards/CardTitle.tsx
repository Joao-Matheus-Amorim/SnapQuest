/**
 * CardTitle — nome no plate de topo, gravado e SEMPRE proporcional.
 *
 * - Posição vertical fixa pela titleArea (idêntica em todas as cartas).
 * - Área segura interna (padding horizontal) → nunca encosta na moldura.
 * - Tamanho dinâmico por comprimento: nome curto = fonte maior; longo = menor.
 * - adjustsFontSizeToFit é a rede de segurança final contra overflow.
 * - Condensação leve (tracking negativo) em nomes longos, sem deformar.
 * - Sombra + brilho metálico para parecer gravado sobre a moldura.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../theme/tokens";
import { FONTS } from "../../theme/fonts";
import { zoneStyle, CARD_LAYOUT } from "../../utils/cardLayout";

type Props = {
  width: number;
  height: number;
  title: string;
  glowColor: string;
};

/** Tamanho-base por comprimento do nome, proporcional à largura da carta. */
function baseFont(title: string, width: number) {
  const len = title.trim().length;
  let factor: number;
  if (len <= 10) factor = 0.092; // curto → grande
  else if (len <= 16) factor = 0.078; // médio
  else if (len <= 24) factor = 0.064; // longo
  else factor = 0.052; // muito longo
  return Math.max(9, Math.round(width * factor));
}

export function CardTitle({ width, height, title, glowColor }: Props) {
  const zone = zoneStyle(CARD_LAYOUT.titleArea, width, height);
  const zoneHeight = CARD_LAYOUT.titleArea.height * height;
  const fontSize = Math.min(baseFont(title, width), Math.floor(zoneHeight * 0.82));
  const lineHeight = Math.min(Math.round(fontSize * 1.08), Math.floor(zoneHeight));

  return (
    <View style={[zone, styles.titleBox]} pointerEvents="none">
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.58}
        style={[
          styles.title,
          { fontSize, lineHeight, textShadowColor: glowColor + "cc" },
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBox: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 8,
  },
  title: {
    color: COLORS.cream,
    fontFamily: FONTS.cinzelBlack,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    letterSpacing: 0,
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 1 },
    width: "100%",
  },
});
