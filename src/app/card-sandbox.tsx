/**
 * CardPreviewSandbox — tela de validação visual do novo sistema de cartas.
 * Renderiza uma carta de cada raridade com dados mockados para conferir:
 * template, encaixe da arte, título, slots de stats, descrição, footer,
 * neon de fundo e foil (épico/lendário). Rota: /card-sandbox
 */
import React from "react";
import { ScrollView, View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GameCard } from "../components/cards/GameCard";
import type { CardRarity, GameCardData } from "../types/card";
import { COLORS } from "../theme/tokens";

const RARITIES: CardRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

function mock(rarity: CardRarity): GameCardData {
  return {
    id: `mock-${rarity}`,
    name: { common: "Guardião do Sofá", uncommon: "Flecha do Quintal", rare: "Névoa do Infinito", epic: "Lâmina do Nexus", legendary: "Avatar de Malakor" }[rarity],
    type: "character",
    rarity,
    image: null,
    placeholderIcon: "atk",
    stats: [
      { icon: "atk", label: "ATK", value: 8, color: COLORS.primary },
      { icon: "def", label: "DEF", value: 7, color: COLORS.accent },
      { icon: "lck", label: "LCK", value: 5, color: COLORS.gold },
      { icon: "spd", label: "SPD", value: 4, color: COLORS.greenSoft },
      { icon: "hp", label: "HP", value: 12, color: COLORS.cream },
    ],
    textBlocks: [
      { kind: "GOLPE", title: "Esmagamento Trovejante", color: COLORS.primary },
      { kind: "VACILO", title: "Pisou no próprio pé", color: COLORS.red },
    ],
  };
}

export default function CardPreviewSandbox() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(220, width - 48);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[COLORS.bgNav, COLORS.bgDeep, "#050712"]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 48 }]}>
        <Text style={styles.title}>Card Sandbox</Text>
        <Text style={styles.subtitle}>5 raridades · dados mockados</Text>
        {RARITIES.map((r) => (
          <View key={r} style={styles.cardWrap}>
            <Text style={styles.rarityTag}>{r.toUpperCase()}</Text>
            <GameCard data={mock(r)} width={cardWidth} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgNav },
  content: { alignItems: "center", paddingHorizontal: 24, gap: 28 },
  title: { color: COLORS.cream, fontSize: 26, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: -16, marginBottom: 8 },
  cardWrap: { alignItems: "center", gap: 10 },
  rarityTag: { color: COLORS.gold, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
});
