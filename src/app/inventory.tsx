import { useState } from "react";
import { Alert, Pressable, ScrollView, View, Text, Image, StyleSheet, useWindowDimensions } from "react-native";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { useCapturedPhotos, type CapturedPhoto } from "../hooks/useCapturedPhotos";
import { useInventory } from "../hooks/useInventory";
import { usePlayerDeck } from "../hooks/usePlayerDeck";
import { transformCapturedPhoto, mockTransform, type GeminiTransformResult } from "../services/geminiTransform";
import { useAuth } from "../hooks/useAuth";
import { syncFighterToCloud, syncCardToCloud, syncCatalogFighter, syncCatalogCard, deleteFighterFromCloud, deleteCardFromCloud } from "../services/cloudSync";
import { isOwner } from "../lib/ownerConfig";
import { persistPhoto } from "../lib/photoStorage";
import { FighterCard } from "../components/FighterCard";
import { CardItem } from "../components/CardItem";
import { RevealModal, type RevealTarget } from "../components/RevealModal";
import { NameInputModal } from "../components/NameInputModal";
import { fighterRarity, cardRarity, RARITY_ORDER, RARITY_LABELS, RARITY_COLORS, type Rarity } from "../lib/rarityConfig";
import { createFighter } from "../js/core/fighters.js";
import { createEffectCard } from "../js/core/cards.js";
import type { Fighter } from "../js/core/fighters.js";
import type { EffectCard } from "../js/core/cards.js";

type TypeFilter = "all" | "fighters" | "cards";
type RarityFilter = "all" | Rarity;

function PendingCapture({ item, onFighter, onCard }: {
  item: CapturedPhoto; onFighter: () => void; onCard: () => void;
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
          <Pressable style={s.btnFighter} onPress={onFighter}>
            <Text style={s.btnFighterText}>⚔️ Fighter</Text>
          </Pressable>
          <Pressable style={s.btnCard} onPress={onCard}>
            <Text style={s.btnCardText}>✨ Carta</Text>
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const [editMode, setEditMode] = useState(false);
  const [reveal, setReveal] = useState<RevealTarget>(null);
  const [pendingCreate, setPendingCreate] = useState<{
    item: CapturedPhoto;
    transform: GeminiTransformResult;
    kind: "fighter" | "card";
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTried, setAiTried] = useState(false);

  const personalFighterIds = new Set(inv.playerFighters.map((f) => f.id));
  const personalCardIds = new Set(inv.playerCards.map((c) => c.id));

  function isDeletable(id: string, kind: "fighter" | "card") {
    if (kind === "fighter") return ownerMode || personalFighterIds.has(id);
    return ownerMode || personalCardIds.has(id);
  }

  async function confirmDelete(id: string, kind: "fighter" | "card", name: string) {
    const isPersonal = kind === "fighter" ? personalFighterIds.has(id) : personalCardIds.has(id);
    Alert.alert(
      "Excluir",
      `Excluir "${name}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir", style: "destructive",
          onPress: async () => {
            if (isPersonal) {
              if (kind === "fighter") await inv.removeFighter(id);
              else await inv.removeCard(id);
            }
            if (kind === "fighter") deleteFighterFromCloud(id).catch(() => {});
            else deleteCardFromCloud(id).catch(() => {});
            if (!isPersonal) inv.reloadCatalog();
          },
        },
      ]
    );
  }

  // Passo 1: gera offline na hora (sem IA) e abre o modal de nome.
  function makeFighter(item: CapturedPhoto) {
    setAiTried(false);
    setPendingCreate({ item, transform: mockTransform(item, "fighter"), kind: "fighter" });
  }

  function makeCard(item: CapturedPhoto) {
    setAiTried(false);
    setPendingCreate({ item, transform: mockTransform(item, "effect_card"), kind: "card" });
  }

  // Sob demanda: gasta 1 chamada de IA pra melhorar nome/golpe/vacilo a partir da foto.
  async function requestAI() {
    if (!pendingCreate || aiLoading) return;
    setAiLoading(true);
    try {
      const target = pendingCreate.kind === "fighter" ? "fighter" : "effect_card";
      const transform = await transformCapturedPhoto({ photo: pendingCreate.item, target });
      setPendingCreate((prev) => (prev ? { ...prev, transform } : prev));
      setAiTried(true);
    } finally {
      setAiLoading(false);
    }
  }

  // Passo 2: usuário confirmou o nome → cria de fato e revela.
  async function finalizeCreate(name: string) {
    if (!pendingCreate) return;
    const { item, transform, kind } = pendingCreate;
    setPendingCreate(null);

    try {
      // Comprime e copia a foto pra pasta permanente (senão fica preta após reiniciar).
      const photoUri = await persistPhoto(item.uri, item.id);
      const persistedItem = { ...item, uri: photoUri };

      if (kind === "fighter") {
        if (ownerMode && item.source === "gallery" && user) {
          const fighter = createFighter({
            classKey: transform.target === "fighter" ? transform.key : "guerreiro",
            name,
            photo: photoUri,
            attackName: transform.target === "fighter" ? transform.attackName : undefined,
            missName: transform.target === "fighter" ? transform.missName : undefined,
          });
          await syncCatalogFighter(fighter, user.id);
          await raw.removeCapturedPhoto(item.id);
          await inv.reload();
          setReveal({ kind: "fighter", data: fighter });
        } else {
          const fighter = await deck.addFighterFromPhoto(persistedItem, transform, name);
          await raw.removeCapturedPhoto(item.id);
          await inv.reload();
          await deck.reload();
          if (user && fighter) syncFighterToCloud(fighter, user.id).catch(() => {});
          if (fighter) setReveal({ kind: "fighter", data: fighter });
        }
      } else {
        if (ownerMode && item.source === "gallery" && user) {
          const card = createEffectCard({
            categoryKey: transform.target === "effect_card" ? transform.key : "criatura",
            name,
            photo: photoUri,
          });
          await syncCatalogCard(card, user.id);
          await raw.removeCapturedPhoto(item.id);
          await inv.reload();
          setReveal({ kind: "card", data: card });
        } else {
          const card = await deck.addCardFromPhoto(persistedItem, transform, name);
          await raw.removeCapturedPhoto(item.id);
          await inv.reload();
          await deck.reload();
          if (user && card) syncCardToCloud(card, user.id).catch(() => {});
          if (card) setReveal({ kind: "card", data: card });
        }
      }
    } catch (e) {
      console.warn("[finalizeCreate] falhou:", String(e));
      Alert.alert("Erro ao criar", "Não consegui salvar a criatura. A foto continua na lista de pendentes — tente de novo.");
    }
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
      <View style={s.titleRow}>
        <Text style={s.title}>Inventário</Text>
        <Pressable style={[s.editBtn, editMode && s.editBtnActive]} onPress={() => setEditMode((v) => !v)}>
          <Text style={[s.editBtnText, editMode && s.editBtnTextActive]}>
            {editMode ? "✓ Pronto" : "✏️ Editar"}
          </Text>
        </Pressable>
      </View>

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
            <PendingCapture key={item.id} item={item}
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
            <View key={f.id} style={s.cardSlot}>
              <FighterCard fighter={f} width={cardWidth} />
              {editMode && isDeletable(f.id, "fighter") && (
                <Pressable style={s.deleteBtn} onPress={() => confirmDelete(f.id, "fighter", f.nome)}>
                  <Text style={s.deleteBtnText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}
          {visibleCards.map(c => (
            <View key={c.id} style={s.cardSlot}>
              <CardItem card={c} width={cardWidth} />
              {editMode && isDeletable(c.id, "card") && (
                <Pressable style={s.deleteBtn} onPress={() => confirmDelete(c.id, "card", c.nome_efeito)}>
                  <Text style={s.deleteBtnText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      <BottomNav />
      <NameInputModal
        visible={pendingCreate !== null}
        kind={pendingCreate?.kind ?? "fighter"}
        suggestedName={pendingCreate?.transform.name ?? ""}
        aiLoading={aiLoading}
        aiNote={
          aiLoading
            ? ""
            : aiTried && pendingCreate?.transform.provider === "gemini"
            ? "✨ Nome e golpe gerados pela IA!"
            : aiTried
            ? "⚠️ IA indisponível agora (cota). Usando nome offline."
            : ""
        }
        onRequestAI={requestAI}
        onConfirm={finalizeCreate}
        onCancel={() => setPendingCreate(null)}
      />
      <RevealModal reveal={reveal} onClose={() => setReveal(null)} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: "#1a1a2e", padding: 20, paddingBottom: BOTTOM_NAV_HEIGHT + 16 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 16 },
  title: { color: "#f5a623", fontSize: 28, fontWeight: "800" },
  editBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(245,166,35,.5)" },
  editBtnActive: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
  editBtnText: { color: "#f5a623", fontSize: 12, fontWeight: "800" },
  editBtnTextActive: { color: "#fff" },

  // Card slot with delete overlay
  cardSlot: { position: "relative" },
  deleteBtn: {
    position: "absolute", top: 6, right: 6, zIndex: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#e94560", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 8,
  },
  deleteBtnText: { color: "#fff", fontSize: 13, fontWeight: "900", lineHeight: 15 },
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
