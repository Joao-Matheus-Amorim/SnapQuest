import { View, Text, Image, StyleSheet } from "react-native";
import type { Fighter } from "../js/core/fighters.js";
import {
  fighterRarity, rarityGlow,
  RARITY_COLORS, RARITY_BORDER, RARITY_LABELS,
} from "../lib/rarityConfig";
import { LegendaryAura } from "./LegendaryAura";

export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 256;

const CLASS_COLORS: Record<string, string> = {
  guerreiro: "#c0392b", mago: "#8e44ad", arqueiro: "#27ae60",
  curandeiro: "#2980b9", paladino: "#7f8c8d", invocador: "#d35400",
  sombrio: "#546e7a", elemental: "#16a085",
};

function classColor(key: string) {
  return CLASS_COLORS[key] ?? "#e94560";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.statPill}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

export function FighterCard({ fighter, width = CARD_WIDTH }: { fighter: Fighter; width?: number }) {
  const rarity = fighterRarity(fighter.bonus_intensidade ?? 1);
  const rarityColor = RARITY_COLORS[rarity];
  const color = classColor(fighter.class_key ?? "");
  const hasPhoto = Boolean(fighter.foto);
  const photoHeight = Math.round(width * 0.8);
  const isLegendary = rarity === "lendário";

  const card = (
    <View style={[
      s.card,
      { width, borderColor: rarityColor, borderWidth: RARITY_BORDER[rarity] },
      !isLegendary && rarityGlow(rarity),
    ]}>
      <View style={[s.photoArea, { width, height: photoHeight }, !hasPhoto && { backgroundColor: color + "22" }]}>
        {hasPhoto ? (
          <Image source={{ uri: fighter.foto ?? undefined }} style={{ width, height: photoHeight }} resizeMode="cover" />
        ) : (
          <Text style={[s.placeholderIcon, { color }]}>{fighter.icon ?? "⚔️"}</Text>
        )}
        <View style={[s.classBadge, { backgroundColor: color }]}>
          <Text style={s.badgeText}>{fighter.classe}</Text>
        </View>
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{fighter.icon} {fighter.nome}</Text>
        {fighter.golpe ? <Text style={s.golpe} numberOfLines={1}>Golpe: {fighter.golpe}</Text> : null}
        {fighter.erro ? <Text style={s.miss} numberOfLines={1}>Vacilo: {fighter.erro}</Text> : null}
        <View style={s.hpRow}>
          <Text style={s.hpLabel}>HP {fighter.hp}</Text>
          <View style={s.hpTrack}>
            <View style={[s.hpFill, { backgroundColor: color }]} />
          </View>
        </View>
        <View style={s.statsRow}>
          <Stat label="ATK" value={fighter.atk} />
          <Stat label="DEF" value={fighter.def} />
          <Stat label="LCK" value={fighter.lck} />
          <Stat label="SPD" value={fighter.spd} />
        </View>
        <View style={[s.rarityBar, { backgroundColor: rarityColor + "33" }]}>
          <Text style={[s.rarityLabel, { color: rarityColor }]}>{RARITY_LABELS[rarity]}</Text>
        </View>
      </View>
    </View>
  );

  if (isLegendary) {
    return <LegendaryAura width={width} height={CARD_HEIGHT}>{card}</LegendaryAura>;
  }
  return card;
}

const s = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    backgroundColor: "#162033",
    borderRadius: 8,
    overflow: "hidden",
  },
  photoArea: {
    backgroundColor: "#101623",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: { fontSize: 52 },
  classBadge: {
    position: "absolute", bottom: 6, left: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },
  badgeText: {
    color: "#fff", fontSize: 9, fontWeight: "800",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  info: { flex: 1, padding: 8, justifyContent: "space-between" },
  name: { color: "#f8fafc", fontSize: 12, fontWeight: "900" },
  golpe: { color: "#86efac", fontSize: 9, fontWeight: "800", marginTop: 1 },
  miss: { color: "rgba(251,113,133,.9)", fontSize: 8, fontStyle: "italic" },
  hpRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  hpLabel: { color: "#fff", fontSize: 9, fontWeight: "700", width: 36 },
  hpTrack: { flex: 1, height: 4, backgroundColor: "#101623", borderRadius: 2 },
  hpFill: { width: "100%", height: 4, borderRadius: 2 },
  statsRow: { flexDirection: "row", gap: 3, marginTop: 4 },
  statPill: {
    flex: 1, backgroundColor: "#101623", borderRadius: 6,
    alignItems: "center", paddingVertical: 3,
  },
  statLabel: { color: "rgba(255,255,255,.5)", fontSize: 8, fontWeight: "700" },
  statValue: { color: "#8ff5e6", fontSize: 11, fontWeight: "900" },
  rarityBar: {
    borderRadius: 6, alignItems: "center", paddingVertical: 3, marginTop: 4,
  },
  rarityLabel: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
});
