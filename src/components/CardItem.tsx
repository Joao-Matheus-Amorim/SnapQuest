import { View, Text, Image, StyleSheet } from "react-native";
import type { EffectCard } from "../js/core/cards.js";
import {
  cardRarity, rarityGlow,
  RARITY_COLORS, RARITY_BORDER, RARITY_LABELS,
} from "../lib/rarityConfig";

export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 256;

const CATEGORY_COLORS: Record<string, string> = {
  natural: "#27ae60", consumivel: "#e67e22", ferramenta: "#546e7a",
  criatura: "#d35400", vestimenta: "#8e44ad", fogo: "#c0392b",
  liquido: "#2980b9", conhecimento: "#16a085",
};

function categoryColor(key: string) {
  return CATEGORY_COLORS[key] ?? "#f5a623";
}

export function CardItem({ card, width = CARD_WIDTH }: { card: EffectCard; width?: number }) {
  const rarity = cardRarity(card.raridade ?? "");
  const rarityColor = RARITY_COLORS[rarity];
  const color = categoryColor(card.categoria_key ?? "");
  const isDebuff = card.polaridade === "DEBUFF";
  const polarityColor = isDebuff ? "#e94560" : "#4caf50";
  const hasPhoto = Boolean(card.foto);
  const photoHeight = Math.round(width * 0.8);

  return (
    <View style={[
      s.card,
      { width, borderColor: rarityColor, borderWidth: RARITY_BORDER[rarity] },
      rarityGlow(rarity),
    ]}>
      <View style={[s.photoArea, { width, height: photoHeight }, !hasPhoto && { backgroundColor: color + "22" }]}>
        {hasPhoto ? (
          <Image source={{ uri: card.foto ?? undefined }} style={{ width, height: photoHeight }} resizeMode="cover" />
        ) : (
          <Text style={[s.placeholderIcon, { color }]}>{card.icon ?? "✨"}</Text>
        )}
        <View style={[s.catBadge, { backgroundColor: color }]}>
          <Text style={s.badgeText}>{card.categoria}</Text>
        </View>
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{card.icon} {card.nome_efeito}</Text>

        <View style={[s.polarityRow, { backgroundColor: polarityColor + "22" }]}>
          <Text style={[s.polarityText, { color: polarityColor }]}>
            {isDebuff ? "▼" : "▲"} {card.atributo} +{card.intensidade}
          </Text>
        </View>

        <View style={s.bottomRow}>
          <Text style={[s.polarity, { color: polarityColor }]}>{card.polaridade}</Text>
        </View>

        <View style={[s.rarityBar, { backgroundColor: rarityColor + "33" }]}>
          <Text style={[s.rarityLabel, { color: rarityColor }]}>{RARITY_LABELS[rarity]}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    backgroundColor: "#16213e",
    borderRadius: 16,
    overflow: "hidden",
  },
  photoArea: {
    backgroundColor: "#0d1117",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: { fontSize: 52 },
  catBadge: {
    position: "absolute", bottom: 6, left: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  badgeText: {
    color: "#fff", fontSize: 9, fontWeight: "800",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  info: { flex: 1, padding: 8, justifyContent: "space-between" },
  name: { color: "#f5a623", fontSize: 12, fontWeight: "800" },
  polarityRow: {
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4,
    marginTop: 4, alignItems: "center",
  },
  polarityText: { fontSize: 13, fontWeight: "800" },
  bottomRow: { flexDirection: "row", justifyContent: "flex-start", marginTop: 2 },
  polarity: { fontSize: 10, fontWeight: "700" },
  rarityBar: {
    borderRadius: 6, alignItems: "center", paddingVertical: 3, marginTop: 4,
  },
  rarityLabel: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
});
