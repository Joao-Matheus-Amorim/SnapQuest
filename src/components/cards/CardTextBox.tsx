/**
 * CardTextBox — área de texto inferior (golpe + vacilo), alinhada e segura.
 *
 * - Hierarquia: 1º bloco (GOLPE) tem destaque maior; demais (VACILO) menores.
 * - Padding seguro → texto nunca encosta na moldura.
 * - adjustsFontSizeToFit + numberOfLines controlam nomes longos sem overflow.
 * Estilo TCG, organização própria.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/tokens";
import { FONTS } from "../../theme/fonts";
import { zoneStyle, CARD_LAYOUT } from "../../utils/cardLayout";
import { blockHeadline, clampText } from "../../utils/cardText";
import type { CardTextBlock } from "../../types/card";

type Props = {
  width: number;
  height: number;
  blocks: CardTextBlock[];
};

export function CardTextBox({ width, height, blocks }: Props) {
  const zone = zoneStyle(CARD_LAYOUT.descriptionArea, width, height);
  const headLg = Math.max(7, Math.round(width * 0.054)); // golpe (destaque)
  const headSm = Math.max(6, Math.round(width * 0.044)); // vacilo (menor)
  const bodySize = Math.max(6, Math.round(width * 0.044));
  const loreSize = Math.max(6, Math.round(width * 0.042));
  const loreLineHeight = Math.max(8, Math.round(loreSize * 1.22));

  return (
    <View style={[zone, styles.box]} pointerEvents="none">
      {blocks.map((b, i) => {
        const lead = i === 0;
        const headline = blockHeadline(b);
        const bodyOnly = !headline;
        return (
          <View key={`${b.kind}-${i}`} style={i > 0 ? styles.blockGap : undefined}>
            {headline ? (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.head,
                  { fontSize: lead ? headLg : headSm, color: b.color ?? COLORS.cream, opacity: lead ? 1 : 0.92 },
                ]}
              >
                {headline}
              </Text>
            ) : null}
            {b.description ? (
              <Text
                numberOfLines={bodyOnly ? 5 : 2}
                adjustsFontSizeToFit
                minimumFontScale={0.52}
                style={[
                  bodyOnly ? styles.loreBody : styles.body,
                  bodyOnly
                    ? { fontSize: loreSize, lineHeight: loreLineHeight }
                    : { fontSize: bodySize },
                ]}
              >
                {bodyOnly ? b.description : clampText(b.description, 90)}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { justifyContent: "center", paddingHorizontal: 4 },
  blockGap: { marginTop: 4 },
  head: {
    fontFamily: FONTS.cinzelBold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,.65)",
    textShadowRadius: 3,
  },
  body: {
    color: "rgba(234,242,255,.82)",
    fontFamily: FONTS.exo2Bold,
    marginTop: 1.5,
    lineHeight: 11,
  },
  loreBody: {
    color: "rgba(234,242,255,.88)",
    fontFamily: FONTS.exo2Bold,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
});
