import { View, Text, Image, StyleSheet } from "react-native";
import type { EffectCard } from "../js/core/cards.js";

export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 240;

const CATEGORY_COLORS: Record<string, string> = {
  natural: "#27ae60",
  tech: "#2980b9",
  mistica: "#8e44ad",
  criatura: "#e67e22",
  urbano: "#546e7a",
  cosmica: "#16a085",
};

const RARITY_STARS: Record<string, string> = {
  comum: "★",
  incomum: "★★",
  raro: "★★★",
  épico: "★★★★",
  lendário: "★★★★★",
};

function categoryColor(key: string) {
  return CATEGORY_COLORS[key] ?? "#f5a623";
}

export function CardItem({ card }: { card: EffectCard }) {
  const color = categoryColor(card.categoria_key ?? "");
  const isDebuff = card.polaridade === "DEBUFF";
  const polarityColor = isDebuff ? "#e94560" : "#4caf50";
  const hasPhoto = Boolean(card.foto);

  return (
    <View style={[s.card, { borderColor: color }]}>
      <View style={[s.photoArea, !hasPhoto && { backgroundColor: color + "22" }]}>
        {hasPhoto ? (
          <Image source={{ uri: card.foto ?? undefined }} style={s.photo} resizeMode="cover" />
        ) : (
          <Text style={[s.placeholderIcon, { color }]}>{card.icon ?? "✨"}</Text>
        )}
        <View style={[s.badge, { backgroundColor: color }]}>
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
          <Text style={[s.rarity, { color }]}>
            {RARITY_STARS[card.raridade?.toLowerCase()] ?? "★"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#16213e",
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 12,
    overflow: "hidden",
  },
  photoArea: {
    width: CARD_WIDTH,
    height: 132,
    backgroundColor: "#0d1117",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: { width: CARD_WIDTH, height: 132 },
  placeholderIcon: { fontSize: 52 },
  badge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  info: { flex: 1, padding: 8, justifyContent: "space-between" },
  name: { color: "#f5a623", fontSize: 12, fontWeight: "800" },
  polarityRow: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 6,
    alignItems: "center",
  },
  polarityText: { fontSize: 13, fontWeight: "800" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  polarity: { fontSize: 10, fontWeight: "700" },
  rarity: { fontSize: 12 },
});
