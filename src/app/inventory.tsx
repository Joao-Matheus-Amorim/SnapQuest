import { useState } from "react";
import { Alert, Pressable, ScrollView, View, Text, Image, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { COLORS, RADIUS } from "../theme/tokens";

type TypeFilter = "all" | "fighters" | "cards";
type RarityFilter = "all" | Rarity;
type InventoryView = "player" | "catalog";

function GrimorioBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[COLORS.bgNav, COLORS.bgDeep, "#050712"]} style={StyleSheet.absoluteFill} />
      <View style={s.backGlowMagenta} />
      <View style={s.backGlowCyan} />
      <View style={s.backGlowGold} />
      <Svg width="100%" height="100%" viewBox="0 0 390 780" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Circle cx="195" cy="184" r="122" fill="none" stroke="rgba(52,225,255,.14)" strokeWidth="1.2" />
        <Circle cx="195" cy="184" r="92" fill="none" stroke="rgba(245,197,66,.16)" strokeWidth="1" strokeDasharray="5 9" />
        <Circle cx="195" cy="184" r="52" fill="none" stroke="rgba(255,61,180,.18)" strokeWidth="1" />
        <Path d="M195 72 255 184 195 296 135 184Z" fill="none" stroke="rgba(234,242,255,.08)" strokeWidth="1" />
        <Path d="M56 356 C116 316 274 316 334 356" fill="none" stroke="rgba(52,225,255,.14)" strokeWidth="1.2" />
        <Path d="M38 644 C132 594 258 594 352 644" fill="none" stroke="rgba(245,197,66,.1)" strokeWidth="1" />
      </Svg>
      <LinearGradient
        colors={["rgba(6,12,26,.04)", "rgba(6,12,26,.62)", "rgba(6,12,26,.94)"]}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function PendingCapture({ item, onFighter, onCard }: {
  item: CapturedPhoto; onFighter: () => void; onCard: () => void;
}) {
  const isCatalog = item.source === "gallery";
  const renderable = !!item.uri &&
    !item.uri.includes("/var/mobile/Media/") && !item.uri.includes("/DCIM/") &&
    (item.uri.startsWith("file://") || item.uri.startsWith("http") || item.uri.startsWith("data:") || item.uri.startsWith("content://"));
  return (
    <View style={s.pendingRow}>
      <LinearGradient colors={["rgba(255,61,180,.12)", "rgba(18,33,66,.94)", "rgba(6,12,26,.98)"]} style={StyleSheet.absoluteFill} />
      {renderable ? (
        <Image source={{ uri: item.uri }} style={s.pendingPhoto} resizeMode="cover" />
      ) : (
        <View style={[s.pendingPhoto, { alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cardSurfaceDeep }]}>
          <Text style={{ fontSize: 28 }}>📷</Text>
        </View>
      )}
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
      <Text numberOfLines={1} adjustsFontSizeToFit style={[s.typeTabText, active && s.typeTabTextActive]}>{label}</Text>
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
  const insets = useSafeAreaInsets();
  const horizontalPadding = 14;
  const gridGap = 10;
  const cardWidth = Math.min(164, Math.floor((screenWidth - horizontalPadding * 2 - gridGap) / 2));

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
    setAiLoading(false);
    setPendingCreate({ item, transform: mockTransform(item, "fighter"), kind: "fighter" });
  }

  function makeCard(item: CapturedPhoto) {
    setAiTried(false);
    setAiLoading(false);
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
    const { item, kind } = pendingCreate;
    const target = kind === "fighter" ? "fighter" : "effect_card";
    let transform = pendingCreate.transform;
    console.log("[create] start kind=", kind, "source=", item.source, "owner=", ownerMode);

    try {
      if (transform.provider !== "gemini-backend" || transform.name.trim() !== name.trim()) {
        setAiLoading(true);
        transform = await transformCapturedPhoto({ photo: item, target, nameHint: name.trim() });
        setAiLoading(false);
      }

      setPendingCreate(null);
      const photoUri = await persistPhoto(item.uri, item.id);
      console.log("[create] persisted:", String(photoUri).slice(0, 60));
      const persistedItem = { ...item, uri: photoUri };

      if (kind === "fighter") {
        if (ownerMode && item.source === "gallery" && user) {
          const fighter = createFighter({
            classKey: transform.target === "fighter" ? transform.key : "guerreiro",
            name,
            photo: photoUri,
            attackName: transform.target === "fighter" ? transform.attackName : undefined,
            missName: transform.target === "fighter" ? transform.missName : undefined,
            description: transform.target === "fighter" ? transform.description : undefined,
          });
          await syncCatalogFighter(fighter, user.id);
          await raw.removeCapturedPhoto(item.id);
          await inv.reloadCatalog();
          setReveal({ kind: "fighter", data: fighter });
        } else {
          console.log("[create] saving fighter to deck");
          const fighter = await deck.addFighterFromPhoto(persistedItem, transform, name);
          console.log("[create] saved; removing captured");
          await raw.removeCapturedPhoto(item.id);
          console.log("[create] reloading inventory/deck");
          await inv.reload();
          await deck.reload();
          console.log("[create] reloaded; opening reveal");
          if (user && fighter) syncFighterToCloud(fighter, user.id).catch(() => {});
          if (fighter) setReveal({ kind: "fighter", data: fighter });
          console.log("[create] reveal set");
        }
      } else {
        if (ownerMode && item.source === "gallery" && user) {
          const card = createEffectCard({
            categoryKey: transform.target === "effect_card" ? transform.key : "criatura",
            name,
            photo: photoUri,
            polarity: transform.target === "effect_card" ? transform.polarity : undefined,
            attribute: transform.target === "effect_card" ? transform.attribute : undefined,
            intensity: transform.target === "effect_card" ? transform.intensity : undefined,
            description: transform.target === "effect_card" ? transform.description : undefined,
          });
          await syncCatalogCard(card, user.id);
          await raw.removeCapturedPhoto(item.id);
          await inv.reloadCatalog();
          setReveal({ kind: "card", data: card });
        } else {
          console.log("[create] saving card to deck");
          const card = await deck.addCardFromPhoto(persistedItem, transform, name);
          console.log("[create] saved; removing captured");
          await raw.removeCapturedPhoto(item.id);
          console.log("[create] reloading inventory/deck");
          await inv.reload();
          await deck.reload();
          console.log("[create] reloaded; opening reveal");
          if (user && card) syncCardToCloud(card, user.id).catch(() => {});
          if (card) setReveal({ kind: "card", data: card });
          console.log("[create] reveal set");
        }
      }
    } catch (e) {
      setAiLoading(false);
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
    <View style={s.screen}>
      <GrimorioBackdrop />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.container, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View entering={FadeInDown.duration(420).springify().damping(16)} style={s.titleRow}>
        <LinearGradient colors={["rgba(234,242,255,.08)", "rgba(6,12,26,.94)", "rgba(6,12,26,.98)"]} style={StyleSheet.absoluteFill} />
        <View style={s.hudSide}>
          <View style={s.hudCrest}><Text style={s.hudCrestText}>I</Text></View>
          <View>
            <Text style={s.hudLabel}>MEU DECK</Text>
            <Text style={s.hudValue}>{inv.battleRequirements.playerFighterCount}/{inv.battleRequirements.playerCardCount}</Text>
          </View>
        </View>
        <View style={s.hudDivider}><Text style={s.hudDividerText}>✦</Text></View>
        <View style={[s.hudSide, s.hudSideRight]}>
          <View>
            <Text style={s.hudLabel}>CATÁLOGO</Text>
            <Text style={s.hudValue}>{inv.battleRequirements.catalogFighterCount}/{inv.battleRequirements.catalogCardCount}</Text>
          </View>
          <PressableScale style={[s.editBtn, editMode && s.editBtnActive]} onPress={() => setEditMode((v) => !v)} haptic="tap" scaleTo={0.92}>
            <Text style={[s.editBtnText, editMode && s.editBtnTextActive]}>
              {editMode ? "OK" : "EDIT"}
            </Text>
          </PressableScale>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(440).springify().damping(16)} style={s.viewTabs}>
        <FilterTab label="Meu Deck" active={inventoryView === "player"} onPress={() => setInventoryView("player")} />
        <FilterTab label="Catalogo" active={inventoryView === "catalog"} onPress={() => setInventoryView("catalog")} />
      </Animated.View>

      {isCatalogView && inv.catalogStatus !== "ready" && inv.catalogErrorMessage ? (
        <View style={[s.catalogNotice, inv.catalogStatus === "error" && s.catalogNoticeError]}>
          <Text style={s.catalogNoticeText}>{inv.catalogErrorMessage}</Text>
        </View>
      ) : null}

      {raw.capturedPhotos.length > 0 && (
        <Animated.View entering={FadeInDown.delay(180).duration(440).springify().damping(16)} style={s.section}>
          <Text style={s.minorSectionTitle}>Aguardando ritual</Text>
          {raw.capturedPhotos.map((item) => (
            <PendingCapture key={item.id} item={item} onFighter={() => makeFighter(item)} onCard={() => makeCard(item)} />
          ))}
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(210).duration(440).springify().damping(16)} style={s.sectionHeader}>
        <View style={s.titleFlourish} />
        <Text style={s.sectionTitle}>{isCatalogView ? "CATÁLOGO ARCANO" : "COLEÇÃO DO JOGADOR"}</Text>
        <Text style={s.sectionMeta}>
          {allFighters.length} Fighters · {allCards.length} Cartas
        </Text>
        <View style={s.titleFlourish} />
      </Animated.View>

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
        <View style={s.emptyBox}>
          <Text style={s.emptyTitle}>Prateleira vazia</Text>
          <Text style={s.emptyText}>Nenhuma carta neste recorte. Capture uma foto no Portal para forjar.</Text>
        </View>
      ) : (
        <View style={s.grid}>
          {visibleFighters.map((f) => (
            <View key={f.id} style={s.cardSlot}>
              <FighterCard fighter={f} width={cardWidth} />
              {editMode && isDeletable(f.id, "fighter") && (
                <Pressable style={s.deleteBtn} onPress={() => confirmDelete(f.id, "fighter", f.nome)}>
                  <Text style={s.deleteBtnText}>X</Text>
                </Pressable>
              )}
            </View>
          ))}
          {visibleCards.map((c) => (
            <View key={c.id} style={s.cardSlot}>
              <CardItem card={c} width={cardWidth} />
              {editMode && isDeletable(c.id, "card") && (
                <Pressable style={s.deleteBtn} onPress={() => confirmDelete(c.id, "card", c.nome_efeito)}>
                  <Text style={s.deleteBtnText}>X</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
      </ScrollView>
      <BottomNav />
      {pendingCreate !== null ? (
        <NameInputModal
          visible
          kind={pendingCreate.kind}
          suggestedName={pendingCreate.transform.name ?? ""}
          aiLoading={aiLoading}
          aiNote={
            aiLoading
              ? "Analisando a foto com IA..."
              : aiTried && pendingCreate.transform.provider === "gemini-backend"
                ? "Nome, atributos e lore gerados pela IA."
                : aiTried
                  ? "IA indisponivel agora. Usando nome offline."
                  : ""
          }
          onRequestAI={requestAI}
          onConfirm={finalizeCreate}
          onCancel={() => setPendingCreate(null)}
        />
      ) : null}
      {reveal ? <RevealModal reveal={reveal} onClose={() => setReveal(null)} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgNav,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 14,
    paddingBottom: BOTTOM_NAV_HEIGHT + 22,
  },
  backGlowMagenta: {
    position: "absolute",
    top: 24,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(255,61,180,.18)",
  },
  backGlowCyan: {
    position: "absolute",
    top: 160,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(52,225,255,.14)",
  },
  backGlowGold: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    width: 240,
    height: 120,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(245,197,66,.1)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.34)",
    backgroundColor: "rgba(6,12,26,.86)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 10,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  hudSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  hudSideRight: {
    justifyContent: "flex-end",
  },
  hudCrest: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    backgroundColor: "rgba(18,33,66,.85)",
    shadowColor: COLORS.gold,
    shadowOpacity: 0.44,
    shadowRadius: 10,
  },
  hudCrestText: {
    color: COLORS.gold,
    fontSize: 15,
    fontWeight: "900",
  },
  hudLabel: {
    color: COLORS.cream,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  hudValue: {
    color: COLORS.accent,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 1,
    textShadowColor: "rgba(52,225,255,.55)",
    textShadowRadius: 10,
  },
  hudDivider: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  hudDividerText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: "900",
    textShadowColor: COLORS.accent,
    textShadowRadius: 12,
  },
  titleBlock: { flex: 1, paddingRight: 12 },
  realm: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 3.5,
    textShadowColor: "rgba(245,197,66,.72)",
    textShadowRadius: 12,
  },
  title: {
    color: COLORS.cream,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    marginTop: 5,
    textShadowColor: "rgba(255,61,180,.5)",
    textShadowRadius: 16,
  },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 7, lineHeight: 19 },
  editBtn: {
    minWidth: 40,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(234,242,255,.24)",
    backgroundColor: "rgba(6,12,26,.66)",
    shadowColor: COLORS.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  editBtnActive: { backgroundColor: COLORS.green, borderColor: COLORS.greenSoft, shadowColor: COLORS.green },
  editBtnText: { color: COLORS.gold, fontSize: 10.5, fontWeight: "900", letterSpacing: 0.5 },
  editBtnTextActive: { color: "#06140b" },
  cardSlot: {
    position: "relative",
    marginBottom: 8,
  },
  deleteBtn: {
    position: "absolute", top: 6, right: 6, zIndex: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 8,
  },
  deleteBtnText: { color: "#fff", fontSize: 13, fontWeight: "900", lineHeight: 15 },
  summaryBox: {
    overflow: "hidden",
    borderColor: "rgba(245,197,66,.42)",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(18,33,66,.82)",
    padding: 15,
    marginBottom: 14,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  summaryCrown: {
    position: "absolute",
    top: 0,
    left: 44,
    right: 44,
    height: 2,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  summaryTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: COLORS.gold, fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.6 },
  summaryText: { color: COLORS.cream, fontSize: 17, fontWeight: "900", marginTop: 3 },
  summarySplit: { width: "100%", marginTop: 12, flexDirection: "row", gap: 10 },
  summaryShard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(52,225,255,.2)",
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(6,12,26,.54)",
    paddingVertical: 9,
  },
  summaryShardValue: { color: COLORS.accent, fontSize: 16, fontWeight: "900" },
  summarySplitText: { color: COLORS.textMuted, fontSize: 10, textAlign: "center", fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  pendingBadge: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.7,
    shadowRadius: 14,
  },
  pendingBadgeText: { color: COLORS.bgNav, fontSize: 15, fontWeight: "900" },
  section: { marginBottom: 14 },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(245,197,66,.38)",
    textShadowRadius: 10,
  },
  minorSectionTitle: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    textShadowColor: "rgba(245,197,66,.38)",
    textShadowRadius: 10,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  sectionMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: -2,
    marginBottom: 5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  titleFlourish: {
    width: 74,
    height: 1,
    marginBottom: 5,
    borderRadius: RADIUS.round,
    backgroundColor: "rgba(245,197,66,.38)",
  },
  viewTabs: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 10,
  },
  catalogNotice: {
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.35)",
    backgroundColor: "rgba(245,197,66,.08)",
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  catalogNoticeError: {
    borderColor: "rgba(244,63,94,.55)",
    backgroundColor: "rgba(244,63,94,.1)",
  },
  catalogNoticeText: { color: COLORS.cream, fontSize: 12, lineHeight: 17 },
  typeTabs: { flexDirection: "row", gap: 7, marginBottom: 9 },
  typeTab: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(52,225,255,.26)",
    backgroundColor: "rgba(18,33,66,.7)",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  typeTabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.cream,
    shadowOpacity: 0.58,
  },
  typeTabText: { color: COLORS.accent, fontSize: 10.5, fontWeight: "900", letterSpacing: 0.4, textTransform: "uppercase", textAlign: "center" },
  typeTabTextActive: { color: COLORS.bgNav },
  rarityRow: { marginBottom: 11 },
  rarityContent: { gap: 7, paddingRight: 8 },
  rarityPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    backgroundColor: "rgba(6,12,26,.52)",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rarityPillText: { fontSize: 10.5, fontWeight: "900", letterSpacing: 0.2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 2,
    paddingBottom: 8,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: "rgba(52,225,255,.18)",
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(6,12,26,.58)",
    padding: 18,
    alignItems: "center",
    marginTop: 12,
  },
  emptyTitle: { color: COLORS.gold, fontSize: 15, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  pendingRow: {
    flexDirection: "row",
    backgroundColor: COLORS.panel,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,.28)",
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  pendingPhoto: { width: 72, height: 72 },
  pendingInfo: { flex: 1, padding: 8, justifyContent: "space-between" },
  pendingLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  pendingLabel: { color: COLORS.gold, fontSize: 11, fontWeight: "900" },
  catalogBadge: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 5, paddingVertical: 1 },
  catalogBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  pendingDate: { color: COLORS.textMuted, fontSize: 10 },
  pendingActions: { flexDirection: "row", gap: 6 },
  btnFighter: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  btnFighterText: { color: COLORS.cream, fontSize: 10.5, fontWeight: "900" },
  btnCard: { borderColor: COLORS.gold, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(245,197,66,.08)" },
  btnCardText: { color: COLORS.gold, fontSize: 10.5, fontWeight: "900" },
});
