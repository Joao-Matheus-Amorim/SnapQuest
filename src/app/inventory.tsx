import { useState } from "react";
import { Alert, Pressable, ScrollView, View, Text, Image, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { BottomNav, BOTTOM_NAV_HEIGHT } from "../components/BottomNav";
import { PressableScale } from "../components/motion/PressableScale";
import { useCapturedPhotos, type CapturedPhoto } from "../hooks/useCapturedPhotos";
import { useInventory } from "../hooks/useInventory";
import { usePlayerDeck } from "../hooks/usePlayerDeck";
import { transformCapturedPhoto, mockTransform, type GeminiTransformResult } from "../services/geminiTransform";
import { useAuth } from "../hooks/useAuth";
import { syncFighterToCloud, syncCardToCloud, syncCatalogFighter, syncCatalogCard, deleteFighterFromCloud, deleteCardFromCloud } from "../services/cloudSync";
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
import { COLORS } from "../theme/tokens";

type TypeFilter = "all" | "fighters" | "cards";
type RarityFilter = "all" | Rarity;
type InventoryView = "player" | "catalog";

function PendingCapture({ item, onFighter, onCard }: {
  item: CapturedPhoto; onFighter: () => void; onCard: () => void;
}) {
  const isCatalog = item.source === "gallery";
  return (
    <View style={s.pendingRow}>
      <Image source={{ uri: item.uri }} style={s.pendingPhoto} resizeMode="cover" />
      <View style={s.pendingInfo}>
        <View style={s.pendingLabelRow}>
          <Text style={s.pendingLabel}>Captura aguardando ritual</Text>
          {isCatalog && <View style={s.catalogBadge}><Text style={s.catalogBadgeText}>CATALOGO</Text></View>}
        </View>
        <Text style={s.pendingDate}>{new Date(item.createdAt).toLocaleString("pt-BR")}</Text>
        <View style={s.pendingActions}>
          <PressableScale style={s.btnFighter} onPress={onFighter} haptic="select">
            <Text style={s.btnFighterText}>Forjar Fighter</Text>
          </PressableScale>
          <PressableScale style={s.btnCard} onPress={onCard} haptic="select">
            <Text style={s.btnCardText}>Forjar Carta</Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

function FilterTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale style={[s.typeTab, active && s.typeTabActive]} onPress={onPress} haptic="select" scaleTo={0.94}>
      <Text style={[s.typeTabText, active && s.typeTabTextActive]}>{label}</Text>
    </PressableScale>
  );
}

function RarityPill({ label, color, active, onPress }: {
  label: string; color: string; active: boolean; onPress: () => void;
}) {
  return (
    <PressableScale
      style={[s.rarityPill, { borderColor: color }, active && { backgroundColor: color }]}
      onPress={onPress}
      haptic="select"
      scaleTo={0.92}
    >
      <Text style={[s.rarityPillText, { color: active ? "#1a1022" : color }]}>{label}</Text>
    </PressableScale>
  );
}

export default function InventoryScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor((screenWidth - 20 * 2 - 12) / 2);

  const inv = useInventory();
  const raw = useCapturedPhotos();
  const deck = usePlayerDeck();
  const { user, canManageCatalog } = useAuth();
  const ownerMode = canManageCatalog;
  const [inventoryView, setInventoryView] = useState<InventoryView>("player");
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
      `Excluir "${name}"? Esta acao nao pode ser desfeita.`,
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

  function makeFighter(item: CapturedPhoto) {
    setAiTried(false);
    setPendingCreate({ item, transform: mockTransform(item, "fighter"), kind: "fighter" });
  }

  function makeCard(item: CapturedPhoto) {
    setAiTried(false);
    setPendingCreate({ item, transform: mockTransform(item, "effect_card"), kind: "card" });
  }

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

  async function finalizeCreate(name: string) {
    if (!pendingCreate) return;
    const { item, transform, kind } = pendingCreate;
    setPendingCreate(null);

    try {
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
          await inv.reloadCatalog();
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
          await inv.reloadCatalog();
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
      Alert.alert("Erro ao criar", "Nao consegui salvar a criatura. A foto continua na lista de pendentes - tente de novo.");
    }
  }

  const allFighters = (inventoryView === "catalog" ? inv.catalogFighters : inv.playerFighters) as Fighter[];
  const allCards = (inventoryView === "catalog" ? inv.catalogCards : inv.playerCards) as EffectCard[];

  const filterFighters = (list: Fighter[]) =>
    rarityFilter === "all" ? list : list.filter((f) => fighterRarity(f.bonus_intensidade ?? 1) === rarityFilter);

  const filterCards = (list: EffectCard[]) =>
    rarityFilter === "all" ? list : list.filter((c) => cardRarity(c.raridade ?? "") === rarityFilter);

  const visibleFighters = typeFilter !== "cards" ? filterFighters(allFighters) : [];
  const visibleCards = typeFilter !== "fighters" ? filterCards(allCards) : [];
  const isEmpty = visibleFighters.length === 0 && visibleCards.length === 0;
  const isCatalogView = inventoryView === "catalog";

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.titleRow}>
        <View style={s.titleBlock}>
          <Text style={s.realm}>GRIMORIO</Text>
          <Text style={s.title}>{isCatalogView ? "Catalogo" : "Meu Deck"}</Text>
          <Text style={s.subtitle}>
            {isCatalogView
              ? "Colecao compartilhada para duelos rapidos."
              : "Criaturas e cartas forjadas por voce."}
          </Text>
        </View>
        <PressableScale style={[s.editBtn, editMode && s.editBtnActive]} onPress={() => setEditMode((v) => !v)} haptic="tap" scaleTo={0.92}>
          <Text style={[s.editBtnText, editMode && s.editBtnTextActive]}>
            {editMode ? "Pronto" : "Editar"}
          </Text>
        </PressableScale>
      </View>

      <View style={s.summaryBox}>
        <Text style={s.summaryLabel}>Prontidao de duelo</Text>
        <Text style={s.summaryText}>
          {inv.battleRequirements.fighterCount} fighters - {inv.battleRequirements.cardCount} cartas disponiveis
        </Text>
        <View style={s.summarySplit}>
          <Text style={s.summarySplitText}>
            Meu deck: {inv.battleRequirements.playerFighterCount} fighters - {inv.battleRequirements.playerCardCount} cartas
          </Text>
          <Text style={s.summarySplitText}>
            Catalogo: {inv.battleRequirements.catalogFighterCount} fighters - {inv.battleRequirements.catalogCardCount} cartas
          </Text>
        </View>
        {raw.capturedPhotos.length > 0 && (
          <Text style={s.pendingBadge}>{raw.capturedPhotos.length} aguardando ritual</Text>
        )}
      </View>

      <View style={s.viewTabs}>
        <FilterTab label="Meu Deck" active={inventoryView === "player"} onPress={() => setInventoryView("player")} />
        <FilterTab label="Catalogo" active={inventoryView === "catalog"} onPress={() => setInventoryView("catalog")} />
      </View>

      {isCatalogView && inv.catalogStatus !== "ready" && inv.catalogErrorMessage ? (
        <View style={[s.catalogNotice, inv.catalogStatus === "error" && s.catalogNoticeError]}>
          <Text style={s.catalogNoticeText}>{inv.catalogErrorMessage}</Text>
        </View>
      ) : null}

      {raw.capturedPhotos.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Aguardando ritual</Text>
          {raw.capturedPhotos.map((item) => (
            <PendingCapture key={item.id} item={item} onFighter={() => makeFighter(item)} onCard={() => makeCard(item)} />
          ))}
        </View>
      )}

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{isCatalogView ? "Catalogo" : "Colecao"}</Text>
        <Text style={s.sectionMeta}>
          {allFighters.length} fighters - {allCards.length} cartas
        </Text>
      </View>

      <View style={s.typeTabs}>
        <FilterTab label="Fighters + Cartas" active={typeFilter === "all"} onPress={() => setTypeFilter("all")} />
        <FilterTab label="Fighters" active={typeFilter === "fighters"} onPress={() => setTypeFilter("fighters")} />
        <FilterTab label="Cartas" active={typeFilter === "cards"} onPress={() => setTypeFilter("cards")} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rarityRow} contentContainerStyle={s.rarityContent}>
        <RarityPill label="Todos" color={COLORS.gold} active={rarityFilter === "all"} onPress={() => setRarityFilter("all")} />
        {RARITY_ORDER.map((r) => (
          <RarityPill
            key={r}
            label={RARITY_LABELS[r]}
            color={RARITY_COLORS[r]}
            active={rarityFilter === r}
            onPress={() => setRarityFilter(r)}
          />
        ))}
      </ScrollView>

      {isEmpty ? (
        <Text style={s.emptyText}>Nenhuma carta neste recorte. Capture uma foto no Portal para forjar.</Text>
      ) : (
        <View style={s.grid}>
          {visibleFighters.map((f, i) => (
            <Animated.View key={f.id} style={s.cardSlot} entering={FadeInDown.delay(i * 40).springify().damping(14)}>
              <FighterCard fighter={f} width={cardWidth} />
              {editMode && isDeletable(f.id, "fighter") && (
                <Pressable style={s.deleteBtn} onPress={() => confirmDelete(f.id, "fighter", f.nome)}>
                  <Text style={s.deleteBtnText}>X</Text>
                </Pressable>
              )}
            </Animated.View>
          ))}
          {visibleCards.map((c, i) => (
            <Animated.View key={c.id} style={s.cardSlot} entering={FadeInDown.delay((visibleFighters.length + i) * 40).springify().damping(14)}>
              <CardItem card={c} width={cardWidth} />
              {editMode && isDeletable(c.id, "card") && (
                <Pressable style={s.deleteBtn} onPress={() => confirmDelete(c.id, "card", c.nome_efeito)}>
                  <Text style={s.deleteBtnText}>X</Text>
                </Pressable>
              )}
            </Animated.View>
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
            : aiTried && pendingCreate?.transform.provider === "gemini-backend"
              ? "Nome e golpe gerados pela IA."
              : aiTried
                ? "IA indisponivel agora. Usando nome offline."
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
  container: { backgroundColor: COLORS.bgDeep, padding: 20, paddingTop: 28, paddingBottom: BOTTOM_NAV_HEIGHT + 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 8, marginBottom: 16 },
  titleBlock: { flex: 1, paddingRight: 12 },
  realm: { color: COLORS.gold, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: COLORS.cream, fontSize: 32, fontWeight: "900", marginTop: 2 },
  subtitle: { color: "rgba(255,247,214,.62)", fontSize: 12, marginTop: 4, lineHeight: 18 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(247,201,72,.5)" },
  editBtnActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  editBtnText: { color: COLORS.gold, fontSize: 12, fontWeight: "900" },
  editBtnTextActive: { color: "#0b1f12" },
  cardSlot: { position: "relative" },
  deleteBtn: {
    position: "absolute", top: 6, right: 6, zIndex: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 8,
  },
  deleteBtnText: { color: "#fff", fontSize: 13, fontWeight: "900", lineHeight: 15 },
  summaryBox: {
    borderColor: "rgba(247,201,72,.5)", borderWidth: 1, borderRadius: 8,
    backgroundColor: COLORS.panel,
    padding: 14, marginBottom: 16, alignItems: "center", gap: 4,
  },
  summaryLabel: { color: COLORS.gold, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.2 },
  summaryText: { color: COLORS.cream, fontSize: 15, fontWeight: "800", textAlign: "center" },
  summarySplit: { width: "100%", marginTop: 6, gap: 4 },
  summarySplitText: { color: "rgba(255,247,214,.8)", fontSize: 12, textAlign: "center", fontWeight: "700" },
  pendingBadge: { color: COLORS.gold, fontSize: 13, fontWeight: "800", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { color: COLORS.gold, fontSize: 16, fontWeight: "900", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  sectionHeader: { marginBottom: 12 },
  sectionMeta: { color: "rgba(255,247,214,.6)", fontSize: 12, marginTop: -6, marginBottom: 4 },
  viewTabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
  catalogNotice: {
    borderWidth: 1,
    borderColor: "rgba(247,201,72,.35)",
    backgroundColor: "rgba(247,201,72,.08)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  catalogNoticeError: {
    borderColor: "rgba(244,63,94,.55)",
    backgroundColor: "rgba(244,63,94,.1)",
  },
  catalogNoticeText: { color: "rgba(255,247,214,.82)", fontSize: 12, lineHeight: 17 },
  typeTabs: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  typeTab: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1, borderColor: "rgba(247,201,72,.4)", backgroundColor: COLORS.panel,
  },
  typeTabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  typeTabText: { color: COLORS.gold, fontSize: 12, fontWeight: "800" },
  typeTabTextActive: { color: "#1a1022" },
  rarityRow: { marginBottom: 16 },
  rarityContent: { gap: 8, paddingRight: 8 },
  rarityPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
  },
  rarityPillText: { fontSize: 12, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  emptyText: { color: "rgba(255,247,214,.5)", fontSize: 14, textAlign: "center", marginTop: 24, lineHeight: 20 },
  pendingRow: {
    flexDirection: "row", backgroundColor: COLORS.panel, borderRadius: 8,
    borderWidth: 1, borderColor: "rgba(247,201,72,.35)", marginBottom: 10, overflow: "hidden",
  },
  pendingPhoto: { width: 90, height: 90 },
  pendingInfo: { flex: 1, padding: 10, justifyContent: "space-between" },
  pendingLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  pendingLabel: { color: COLORS.gold, fontSize: 12, fontWeight: "900" },
  catalogBadge: { backgroundColor: "#8e44ad", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  catalogBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  pendingDate: { color: "rgba(255,247,214,.55)", fontSize: 11 },
  pendingActions: { flexDirection: "row", gap: 8 },
  btnFighter: { backgroundColor: COLORS.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  btnFighterText: { color: COLORS.cream, fontSize: 12, fontWeight: "900" },
  btnCard: { borderColor: COLORS.gold, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  btnCardText: { color: COLORS.gold, fontSize: 12, fontWeight: "900" },
});
