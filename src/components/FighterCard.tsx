import { View, Text, Image, StyleSheet } from "react-native";
import type { Fighter } from "../js/core/fighters.js";

export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 240;

const CLASS_COLORS: Record<string, string> = {
  guerreiro: "#c0392b",
  mago: "#8e44ad",
  arqueiro: "#27ae60",
  curandeiro: "#2980b9",
  invocador: "#d35400",
  sombrio: "#546e7a",
  elemental: "#16a085",
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

export function FighterCard({ fighter }: { fighter: Fighter }) {
  const color = classColor(fighter.class_key ?? "");
  const hasPhoto = Boolean(fighter.foto);

  return (
    <View style={[s.card, { borderColor: color }]}>
      <View style={[s.photoArea, !hasPhoto && { backgroundColor: color + "22" }]}>
        {hasPhoto ? (
          <Image source={{ uri: fighter.foto }} style={s.photo} resizeMode="cover" />
        ) : (
          <Text style={[s.placeholderIcon, { color }]}>{fighter.icon ?? "⚔️"}</Text>
        )}
        <View style={[s.badge, { backgroundColor: color }]}>
          <Text style={s.badgeText}>{fighter.classe}</Text>
        </View>
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{fighter.icon} {fighter.nome}</Text>
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
  hpRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  hpLabel: { color: "#fff", fontSize: 9, fontWeight: "700", width: 36 },
  hpTrack: { flex: 1, height: 4, backgroundColor: "#0d1117", borderRadius: 2 },
  hpFill: { width: "100%", height: 4, borderRadius: 2 },
  statsRow: { flexDirection: "row", gap: 3, marginTop: 4 },
  statPill: {
    flex: 1,
    backgroundColor: "#0d1117",
    borderRadius: 6,
    alignItems: "center",
    paddingVertical: 3,
  },
  statLabel: { color: "rgba(255,255,255,.5)", fontSize: 8, fontWeight: "700" },
  statValue: { color: "#f5a623", fontSize: 11, fontWeight: "800" },
});
