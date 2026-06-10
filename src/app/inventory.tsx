import { useState } from "react";
import { Pressable, ScrollView, View, Text, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useCapturedPhotos, type CapturedPhoto } from "../hooks/useCapturedPhotos";
import { useInventory } from "../hooks/useInventory";
import { usePlayerDeck } from "../hooks/usePlayerDeck";
import { transformCapturedPhoto } from "../services/geminiTransform";
import { useAuth } from "../hooks/useAuth";
import { syncFighterToCloud, syncCardToCloud, syncCatalogFighter, syncCatalogCard } from "../services/cloudSync";
import { isOwner } from "../lib/ownerConfig";
import { FighterCard } from "../components/FighterCard";
import { CardItem } from "../components/CardItem";
import { fighterRarity, cardRarity, RARITY_ORDER, RARITY_LABELS, RARITY_COLORS, type Rarity } from "../lib/rarityConfig";
import { createFighter } from "../js/core/fighters.js";
import { createEffectCard } from "../js/core/cards.js";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

type TypeFilter = "all" | "fighters" | "cards";
type RarityFilter = "all" | Rarity;

function PendingCapture({ item, busy, onFighter, onCard }: {
  item: CapturedPhoto; busy: boolean; onFighter: () => void; onCard: () => void;
}) {
  const isCatalog = item.source === "gallery";
  return (
    <View style={s.pendingRow}>
      <Image source={{ uri: item.uri }} style={s.pendingPhoto} resizeMode="cover" />
      <View style={s.pendingInfo}>
        <View style={s.pendingLabelRow}>
          <Text style={s.pendingLabel}>Captura bruta</Text>
          {isCatalog && <View style={s.catalogBadge}><Text style={s.catalogBadgeText}>CATÁLOGO</Text></View>}
        </View>
        <Text style={s.pendingDate}>{new Date(item.createdAt).toLocaleString("pt-BR")}</Text>
        <View style={s.pendingActions}>
          <Pressable style={s.btnFighter} disabled={busy} onPress={onFighter}>
            <Text style={s.btnFighterText}>{busy ? "..." : "⚔️ Fighter"}</Text>
          </Pressable>
          <Pressable style={s.btnCard} disabled={busy} onPress={onCard}>
            <Text style={s.btnCardText}>{busy ? "..." : "✨ Carta"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TypeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[s.typeTab, active && s.typeTabActive]} onPress={onPress}>
      <Text style={[s.typeTabText, active && s.typeTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RarityPill({ label, color, active, onPress }: {
  label: string; color: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      style={[s.rarityPill, { borderColor: color }, active && { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={[s.rarityPillText, { color: active ? "#fff" : color }]}>{label}</Text>
    </Pressable>
  );
}

export default function InventoryScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor((screenWidth - 20 * 2 - 12) / 2);

  const inv = useInventory();
  const raw = useCapturedPhotos();
  const deck = usePlayerDeck();
  const { user } = useAuth();
  const ownerMode = isOwner(user?.email);
  const [busy, setBusy] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");

  async function makeFighter(item: CapturedPhoto) {
    setBusy(item.id);
    try {
      const transform = await transformCapturedPhoto({ photo: item, target: "fighter" });
      if (ownerMode && item.source === "gallery" && user) {
        const fighter = createFighter({
          classKey: transform?.target === "fighter" ? transform.key : "guerreiro",
          name: transform?.target === "fighter" ? transform.name : "Fighter Base",
          photo: item.uri,
        });
        await syncCatalogFighter(fighter, user.id);
        await raw.removeCapturedPhoto(item.id);
        await inv.reload();
      } else {
        const fighter = await deck.addFighterFromPhoto(item, transform);
        await raw.removeCapturedPhoto(item.id);
        await inv.reload();
        await deck.reload();
        if (user && fighter) syncFighterToCloud(fighter, user.id).catch(() => {});
      }
    } finally { setBusy(null); }
  }

  async function makeCard(item: CapturedPhoto) {
    setBusy(item.id);
    try {
      const transform = await transformCapturedPhoto({ photo: item, target: "effect_card" });
      if (ownerMode && item.source === "gallery" && user) {
        const card = createEffectCard({
          categoryKey: transform?.target === "effect_card" ? transform.key : "criatura",
          name: transform?.target === "effect_card" ? transform.name : "Carta Base",
          photo: item.uri,
        });
        await syncCatalogCard(card, user.id);
        await raw.removeCapturedPhoto(item.id);
        await inv.reload();
      } else {
        const card = await deck.addCardFromPhoto(item, transform);
        await raw.removeCapturedPhoto(item.id);
        await inv.reload();
        await deck.reload();
        if (user && card) syncCardToCloud(card, user.id).catch(() => {});
      }
    } finally { setBusy(null); }
  }

  const allFighters = inv.fighters as Fighter[];
  const allCards = inv.cards as EffectCard[];

  const filterFighters = (list: Fighter[]) =>
    rarityFilter === "all" ? list : list.filter(f => fighterRarity(f.bonus_intensidade ?? 1) === rarityFilter);

  const filterCards = (list: EffectCard[]) =>
    rarityFilter === "all" ? list : list.filter(c => cardRarity(c.raridade ?? "") === rarityFilter);

  const visibleFighters = typeFilter !== "cards" ? filterFighters(allFighters) : [];
  const visibleCards = typeFilter !== "fighters" ? filterCards(allCards) : [];
  const isEmpty = visibleFighters.length === 0 && visibleCards.length === 0;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Inventário</Text>

      {/* Resumo */}
      <View style={s.summaryBox}>
        <Text style={s.summaryText}>
          ⚔️ {inv.battleRequirements.fighterCount}/{inv.battleRequirements.minFighters}{"   "}
          ✨ {inv.battleRequirements.cardCount}/{inv.battleRequirements.minCards}
        </Text>
        {raw.capturedPhotos.length > 0 && (
          <Text style={s.pendingBadge}>📷 {raw.capturedPhotos.length} pendente{raw.capturedPhotos.length > 1 ? "s" : ""}</Text>
        )}
      </View>

      {/* Capturas pendentes */}
      {raw.capturedPhotos.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pendentes</Text>
          {raw.capturedPhotos.map(item => (
            <PendingCapture key={item.id} item={item} busy={busy === item.id}
              onFighter={() => makeFighter(item)} onCard={() => makeCard(item)} />
          ))}
        </View>
      )}

      {/* Filtro de tipo */}
      <View style={s.typeTabs}>
        <TypeTab label="⚔️ Fighters + ✨ Cartas" active={typeFilter === "all"} onPress={() => setTypeFilter("all")} />
        <TypeTab label="⚔️ Fighters" active={typeFilter === "fighters"} onPress={() => setTypeFilter("fighters")} />
        <TypeTab label="✨ Cartas" active={typeFilter === "cards"} onPress={() => setTypeFilter("cards")} />
      </View>

      {/* Filtro de raridade */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rarityRow} contentContainerStyle={s.rarityContent}>
        <RarityPill label="Todos" color="#f5a623" active={rarityFilter === "all"} onPress={() => setRarityFilter("all")} />
        {RARITY_ORDER.map(r => (
          <RarityPill key={r} label={RARITY_LABELS[r]} color={RARITY_COLORS[r]}
            active={rarityFilter === r} onPress={() => setRarityFilter(r)} />
        ))}
      </ScrollView>

      {/* Grid */}
      {isEmpty ? (
        <Text style={s.emptyText}>Nenhum item nesta raridade.</Text>
      ) : (
        <View style={s.grid}>
          {visibleFighters.map(f => (
            <View key={f.id} style={{ width: cardWidth }}>
              <FighterCard fighter={f} width={cardWidth} />
            </View>
          ))}
          {visibleCards.map(c => (
            <View key={c.id} style={{ width: cardWidth }}>
              <CardItem card={c} width={cardWidth} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: "#1a1a2e", padding: 20, paddingBottom: 52 },
  title: { color: "#f5a623", fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: 8, marginBottom: 16 },
  summaryBox: {
    borderColor: "#f5a623", borderWidth: 1, borderRadius: 16,
    padding: 14, marginBottom: 20, alignItems: "center", gap: 4,
  },
  summaryText: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "center" },
  pendingBadge: { color: "#f5a623", fontSize: 13, fontWeight: "700" },
  section: { marginBottom: 20 },
  sectionTitle: { color: "#f5a623", fontSize: 17, fontWeight: "800", marginBottom: 12 },

  // Type tabs
  typeTabs: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  typeTab: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(245,166,35,.4)",
  },
  typeTabActive: { backgroundColor: "#f5a623" },
  typeTabText: { color: "#f5a623", fontSize: 12, fontWeight: "700" },
  typeTabTextActive: { color: "#1a1a2e" },

  // Rarity filter
  rarityRow: { marginBottom: 16 },
  rarityContent: { gap: 8, paddingRight: 8 },
  rarityPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
  },
  rarityPillText: { fontSize: 12, fontWeight: "800" },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  emptyText: { color: "rgba(255,255,255,.5)", fontSize: 14, textAlign: "center", marginTop: 24 },

  // Pending
  pendingRow: {
    flexDirection: "row", backgroundColor: "#16213e", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(245,166,35,.35)", marginBottom: 10, overflow: "hidden",
  },
  pendingPhoto: { width: 90, height: 90 },
  pendingInfo: { flex: 1, padding: 10, justifyContent: "space-between" },
  pendingLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  pendingLabel: { color: "#f5a623", fontSize: 13, fontWeight: "800" },
  catalogBadge: { backgroundColor: "#8e44ad", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  catalogBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  pendingDate: { color: "rgba(255,255,255,.6)", fontSize: 11 },
  pendingActions: { flexDirection: "row", gap: 8 },
  btnFighter: { backgroundColor: "#e94560", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  btnFighterText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  btnCard: { borderColor: "#f5a623", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  btnCardText: { color: "#f5a623", fontSize: 12, fontWeight: "800" },
});
