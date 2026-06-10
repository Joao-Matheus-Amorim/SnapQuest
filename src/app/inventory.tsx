import { useState } from "react";
import { Pressable, ScrollView, View, Text, Image, StyleSheet } from "react-native";
import { useCapturedPhotos, type CapturedPhoto } from "../hooks/useCapturedPhotos";
import { useInventory } from "../hooks/useInventory";
import { usePlayerDeck } from "../hooks/usePlayerDeck";
import { transformCapturedPhoto } from "../services/geminiTransform";
import { useAuth } from "../hooks/useAuth";
import { syncFighterToCloud, syncCardToCloud, syncCatalogFighter, syncCatalogCard } from "../services/cloudSync";
import { isOwner } from "../lib/ownerConfig";
import { createFighter } from "../js/core/fighters.js";
import { createEffectCard } from "../js/core/cards.js";
import { FighterCard } from "../components/FighterCard";
import { CardItem } from "../components/CardItem";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

function PendingCapture({
  item,
  busy,
  onFighter,
  onCard,
}: {
  item: CapturedPhoto;
  busy: boolean;
  onFighter: () => void;
  onCard: () => void;
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

function HSection({ title, children, empty }: { title: string; children: React.ReactNode; empty: string }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
        {children ?? <Text style={s.emptyText}>{empty}</Text>}
      </ScrollView>
    </View>
  );
}

export default function InventoryScreen() {
  const inv = useInventory();
  const raw = useCapturedPhotos();
  const deck = usePlayerDeck();
  const { user } = useAuth();
  const ownerMode = isOwner(user?.email);
  const [busy, setBusy] = useState<string | null>(null);

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
    } finally {
      setBusy(null);
    }
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
    } finally {
      setBusy(null);
    }
  }

  const playerFighters = inv.playerFighters as Fighter[];
  const playerCards = inv.playerCards as EffectCard[];
  const baseFighters = inv.fighters.slice(playerFighters.length) as Fighter[];
  const baseCards = inv.cards.slice(playerCards.length) as EffectCard[];

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Inventário</Text>

      {/* Resumo */}
      <View style={s.summaryBox}>
        <Text style={s.summaryText}>
          ⚔️ {inv.battleRequirements.fighterCount}/{inv.battleRequirements.minFighters} Fighters
          {"   "}
          ✨ {inv.battleRequirements.cardCount}/{inv.battleRequirements.minCards} Cartas
        </Text>
        {raw.capturedPhotos.length > 0 && (
          <Text style={s.pendingBadge}>📷 {raw.capturedPhotos.length} pendente{raw.capturedPhotos.length > 1 ? "s" : ""}</Text>
        )}
      </View>

      {/* Capturas pendentes */}
      {raw.capturedPhotos.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pendentes</Text>
          {raw.capturedPhotos.map((item) => (
            <PendingCapture
              key={item.id}
              item={item}
              busy={busy === item.id}
              onFighter={() => makeFighter(item)}
              onCard={() => makeCard(item)}
            />
          ))}
        </View>
      )}

      {/* Seus Fighters */}
      <HSection title="Seus Fighters" empty="Nenhum fighter criado ainda.">
        {playerFighters.length > 0
          ? playerFighters.map((f) => <FighterCard key={f.id} fighter={f} />)
          : null}
      </HSection>

      {/* Suas Cartas */}
      <HSection title="Suas Cartas" empty="Nenhuma carta criada ainda.">
        {playerCards.length > 0
          ? playerCards.map((c) => <CardItem key={c.id} card={c} />)
          : null}
      </HSection>

      {/* Fighters Base */}
      {baseFighters.length > 0 && (
        <HSection title="Fighters Base" empty="">
          {baseFighters.map((f) => <FighterCard key={f.id} fighter={f} />)}
        </HSection>
      )}

      {/* Cartas Base */}
      {baseCards.length > 0 && (
        <HSection title="Cartas Base" empty="">
          {baseCards.map((c) => <CardItem key={c.id} card={c} />)}
        </HSection>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: "#1a1a2e", padding: 20, paddingBottom: 52 },
  title: {
    color: "#f5a623",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  summaryBox: {
    borderColor: "#f5a623",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
    gap: 4,
  },
  summaryText: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "center" },
  pendingBadge: { color: "#f5a623", fontSize: 13, fontWeight: "700" },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: "#f5a623",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  hScroll: { paddingRight: 20, paddingBottom: 4 },
  emptyText: { color: "rgba(255,255,255,.5)", fontSize: 13, paddingTop: 4 },

  // Pending row
  pendingRow: {
    flexDirection: "row",
    backgroundColor: "#16213e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,.35)",
    marginBottom: 10,
    overflow: "hidden",
  },
  pendingPhoto: { width: 90, height: 90 },
  pendingInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  pendingLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  pendingLabel: { color: "#f5a623", fontSize: 13, fontWeight: "800" },
  catalogBadge: { backgroundColor: "#8e44ad", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  catalogBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  pendingDate: { color: "rgba(255,255,255,.6)", fontSize: 11 },
  pendingActions: { flexDirection: "row", gap: 8 },
  btnFighter: {
    backgroundColor: "#e94560",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnFighterText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  btnCard: {
    borderColor: "#f5a623",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnCardText: { color: "#f5a623", fontSize: 12, fontWeight: "800" },
});
